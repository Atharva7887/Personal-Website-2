"""Prepare the Studio room's 3D models for the web.

Takes the large reference models in exports/refreences, keeps the parts the room uses,
decimates them, shrinks their textures and writes small Draco + WebP .glb files to public/models.

Usage (from the project folder, with Blender 4.2+):
    blender --background --python scripts/room-assets/prepare.py -- exports/refreences <extracted> public/models

<extracted> is a folder holding four of the reference .zip archives, unzipped into these sub-folders:
    vine/        Places and elements/vine-with-branch-3d-model-free.zip
    pothos/      New ref/free-pothos-potted-plant-money-plant.zip
    greenhouse/  New ref/greenhouse-in-the-garden-draft.zip
    zz-plant/    New ref/zz-plant-in-ceramic-pot-crafted-by-jerovdl (1).zip
    trees/       New ref/Grass and grass land/low-poly-tree-scene-free.zip
Set ROOM_ASSETS_ONLY=prepare_plants (or any other step's name) to run one step.
Optional 4th and 5th arguments: a log file and a "done" marker file (for launchers that hide stdout).
"""
import math
import os
import sys
import tempfile
import traceback

import bpy
import numpy as np
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
REFS, EXTRACTED, OUT = argv[0], argv[1], argv[2]
LOG = open(argv[3], "w", encoding="utf-8") if len(argv) > 3 else None
DONE = argv[4] if len(argv) > 4 else None
TMP = os.path.join(tempfile.gettempdir(), "room-assets")  # scratch .blend files while combining models


def log(*a):
    line = " ".join(str(x) for x in a)
    print(line)
    if LOG:
        LOG.write(line + "\n")
        LOG.flush()


# ---------------------------------------------------------------- helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(path, weld=False):
    # weld: join the vertices a scan splits along its texture seams, so decimating does not tear it
    bpy.ops.import_scene.gltf(filepath=path, merge_vertices=weld)
    for o in bpy.data.objects:
        o.animation_data_clear()
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)


def descendants(o):
    out = [o]
    for c in o.children:
        out += descendants(c)
    return out


def tri_count(o):
    o.data.calc_loop_triangles()
    return len(o.data.loop_triangles)


def with_active(o, fn):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    fn()


def unparent(objs):
    """Detach from the glTF hierarchy, keeping world transforms, and give each its own mesh."""
    for o in objs:
        m = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = m
        if o.data.users > 1:
            o.data = o.data.copy()


def decimate(o, ratio):
    if ratio >= 0.999:
        return
    mod = o.modifiers.new("dec", "DECIMATE")
    mod.ratio = ratio
    with_active(o, lambda: bpy.ops.object.modifier_apply(modifier=mod.name))


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    o.data.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


def smooth(o, angle_deg=40):
    me = o.data

    def clear():
        try:
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
        except Exception as e:  # no custom normals: fine
            log("  (no custom normals to clear on", o.name, ")", type(e).__name__)

    with_active(o, clear)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    me.set_sharp_from_angle(angle=math.radians(angle_deg))
    me.update()


def bounds(objs):
    # From the vertices, not o.bound_box: that is stale right after mesh.transform().
    lo = np.full(3, 1e9)
    hi = np.full(3, -1e9)
    for o in objs:
        co = np.empty(len(o.data.vertices) * 3, dtype=np.float32)
        o.data.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3) + np.array(o.location)
        lo = np.minimum(lo, co.min(axis=0))
        hi = np.maximum(hi, co.max(axis=0))
    return Vector(lo.tolist()), Vector(hi.tolist())


def transform_all(objs, mat):
    for o in objs:
        o.data.transform(mat)
        o.data.update()


def set_origin(o, point):
    """Move the object's origin to a world-space point (object has identity transform)."""
    o.data.transform(Matrix.Translation(-point))
    o.data.update()
    o.location = point


def shrink_images(limit_for):
    for img in bpy.data.images:
        if not img.size[0]:
            continue
        limit = limit_for(img)
        w, h = img.size
        if max(w, h) > limit:
            k = limit / max(w, h)
            img.scale(max(1, int(w * k)), max(1, int(h * k)))


def principled(mat):
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None) if mat.node_tree else None


def unlink_input(mat, socket_name):
    b = principled(mat)
    if not b:
        return
    for link in list(b.inputs[socket_name].links):
        mat.node_tree.links.remove(link)


def drop_unused_image_nodes(mat):
    """Remove image nodes that no longer feed anything, so the exporter skips their textures."""
    tree = mat.node_tree
    changed = True
    while changed:
        changed = False
        for n in list(tree.nodes):
            if n.type in {"TEX_IMAGE", "NORMAL_MAP", "SEPARATE_COLOR", "MAPPING", "TEX_COORD", "MIX", "MATH"} and not any(s.links for s in n.outputs):
                tree.nodes.remove(n)
                changed = True


def export(objs, name, draco=True):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    path = os.path.join(OUT, name)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_extras=False,
        export_image_format="WEBP",
        export_image_quality=80,
        export_draco_mesh_compression_enable=draco,
    )
    log(f"wrote {name}: {os.path.getsize(path) / 1024:.0f} KB, {sum(tri_count(o) for o in objs)} tris")


# ---------------------------------------------------------------- desk setup + chair
# "Modern Gaming PC & Workspace Setup" by Syzoth (CC BY 4.0).
SETUP_PARTS = {
    "Desk": (["Cube.012_", "Cube.001_"], 9000),
    "Keyboard": (["Keyboard_Body_"], 6000),
    "Mouse": (["Mouse_Body_", "Pad_"], 1800),
    "Chair": (["Cube.009_", "Cube.011_", "Cube_5", "Cylinder.006_", "Cylinder_21", "Object.001_", "Object_133", "Plane.005_", "Plane.006_", "Plane.007_", "Plane.009_", "Plane.011_"], 48000),
}
METRES = 0.082  # model units -> metres (chair ends up about 1.34 m tall)


def prepare_setup():
    reset()
    import_glb(os.path.join(REFS, "Setup and chair", "modern_gaming_pc__workspace_setup.glb"))
    root = bpy.data.objects["GLTF_SceneRootNode"]
    groups = {}
    for g in root.children:
        for part, (prefixes, _) in SETUP_PARTS.items():
            if any(g.name.startswith(p) for p in prefixes):
                groups.setdefault(part, []).extend(o for o in descendants(g) if o.type == "MESH")
    result = {}
    for part, (_, budget) in SETUP_PARTS.items():
        objs = groups[part]
        unparent(objs)
        total = sum(tri_count(o) for o in objs)
        big = [o for o in objs if tri_count(o) > 400]
        small_total = total - sum(tri_count(o) for o in big)
        ratio = min(1.0, max(0.02, (budget - small_total) / max(1, total - small_total)))
        for o in big:
            decimate(o, ratio)
        result[part] = join(objs, part)
        smooth(result[part], 45 if part == "Chair" else 35)
        log(f"{part}: {total} -> {tri_count(result[part])} tris (ratio {ratio:.3f})")
    keep = list(result.values())
    for o in list(bpy.data.objects):
        if o not in keep:
            bpy.data.objects.remove(o, do_unlink=True)

    # Face the room: desk back towards Blender +Y (three.js -Z), metres, desk centred on the floor.
    transform_all(keep, Matrix.Rotation(math.pi, 4, "Z") @ Matrix.Scale(METRES, 4))
    lo, hi = bounds([result["Desk"]])
    floor_z = min(bounds([o])[0].z for o in keep)
    transform_all(keep, Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -floor_z))))
    for o in keep:
        lo, hi = bounds([o])
        set_origin(o, Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z)))
        log(f"  {o.name}: origin {[round(v, 3) for v in o.location]} size {[round(v, 3) for v in (hi - lo)]}")

    # Materials: keyboards lose their normal maps. (The set's own monitor is left out: the room uses the ultrawide one.)
    for mat in bpy.data.materials:
        if not mat.node_tree:
            continue
        if mat.name.startswith("Keyboard"):
            unlink_input(mat, "Normal")
        drop_unused_image_nodes(mat)

    def limit(img):
        users = [m.name for m in bpy.data.materials if m.node_tree and any(n.type == "TEX_IMAGE" and n.image == img for n in m.node_tree.nodes)]
        if any(u.startswith(("Material.002", "Material.004", "Material.010")) for u in users):
            return 1024
        return 512

    shrink_images(limit)
    export(keep, "studio-setup.glb")


# ---------------------------------------------------------------- laptop
# "HP Omen Laptop" by Fadi (CC BY 4.0).
def prepare_laptop():
    reset()
    import_glb(os.path.join(REFS, "Laptop", "hp_omen_laptop.glb"))
    # The tiny sticker decals (brand logos) are dropped: their textures are too small to re-encode and the room does not need them.
    stickers = {"material", "nvidia", "refresh_rate", "Bang__olufsen", "Decoration"}
    objs = [o for o in bpy.data.objects if o.type == "MESH" and not any(m and m.name in stickers for m in o.data.materials)]
    unparent(objs)
    for o in objs:
        n = tri_count(o)
        mats = [m.name for m in o.data.materials if m]
        if "Keys" in mats:
            decimate(o, 0.4)
        elif n > 3000:
            decimate(o, 0.12)
    for mat in bpy.data.materials:
        if mat.name == "screen":
            mat.name = "LaptopScreen"
    laptop = join(objs, "Laptop")
    smooth(laptop, 35)
    for o in list(bpy.data.objects):
        if o is not laptop:
            bpy.data.objects.remove(o, do_unlink=True)
    lo, hi = bounds([laptop])
    set_origin(laptop, Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z)))
    laptop.location = (0, 0, 0)
    log(f"Laptop size {[round(v, 3) for v in (hi - lo)]}")
    shrink_images(lambda img: 512)
    export([laptop], "laptop.glb")


# ---------------------------------------------------------------- vine
def prepare_vine():
    reset()
    import_glb(os.path.join(EXTRACTED, "vine", "source", "Vine with branch 3d model free.glb"))
    objs = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(objs)
    for o in objs:
        decimate(o, 0.42)
    vine = join(objs, "Vine")
    for o in list(bpy.data.objects):
        if o is not vine:
            bpy.data.objects.remove(o, do_unlink=True)
    lo, hi = bounds([vine])
    # Hangs from its top-centre.
    set_origin(vine, Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, hi.z)))
    vine.location = (0, 0, 0)
    log(f"Vine size {[round(v, 3) for v in (hi - lo)]}")
    for mat in bpy.data.materials:
        b = principled(mat)
        if not b:
            continue
        mat.name = "VineLeaf"
        for s in ("Transmission Weight", "Metallic"):
            if s in b.inputs:
                unlink_input(mat, s)
                b.inputs[s].default_value = 0
        unlink_input(mat, "Roughness")
        b.inputs["Roughness"].default_value = 0.65
        mat.use_backface_culling = False
        drop_unused_image_nodes(mat)
    shrink_images(lambda img: 1024)
    export([vine], "vine.glb")


# ---------------------------------------------------------------- gaming corner
# Side table + PS5 controller (exports/refreences/Controller and stand/Untitled.glb),
# "Bomb Monkey" controller stand by nosimaj4 (CC BY 4.0), "PS5" by rtql8d (CC BY 4.0).
GAMING = os.path.join("Controller and stand")
# Where the controller rests on the stand's hands (metres, stand facing +X), and its tilt.
CONTROLLER_ON_STAND = (0.055, 0.0, 0.068)
CONTROLLER_TILT = math.radians(-30)


def keep_only(objs):
    for o in list(bpy.data.objects):
        if o not in objs:
            bpy.data.objects.remove(o, do_unlink=True)


def floor_centre(o):
    """Stand the object on the origin."""
    lo, hi = bounds([o])
    o.data.transform(Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))))
    o.data.update()
    o.location = (0, 0, 0)
    return hi - lo


def save_blend(name):
    path = os.path.join(TMP, name)
    bpy.ops.wm.save_as_mainfile(filepath=path, copy=True)
    return path


def append_objects(path):
    with bpy.data.libraries.load(path) as (src, dst):
        dst.objects = list(src.objects)
    for o in dst.objects:
        bpy.context.scene.collection.objects.link(o)
    return list(dst.objects)


def prepare_gaming():
    # --- side table and controller
    reset()
    import_glb(os.path.join(REFS, GAMING, "Untitled.glb"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.data.materials and o.data.materials[0]]
    unparent(meshes)
    table = join([o for o in meshes if o.data.materials[0].name == "Wooden Table"], "Table")
    pad = join([o for o in meshes if o.data.materials[0].name == "Material.001"], "Controller")
    keep_only([table, pad])
    lo, hi = bounds([pad])
    k = 0.16 / max(hi - lo)  # a controller is about 16 cm wide
    transform_all([table, pad], Matrix.Scale(k, 4))
    decimate(pad, 0.25)
    smooth(pad, 40)
    size = floor_centre(pad)
    log("Controller size", [round(v, 3) for v in size])
    if size.x > size.y:  # widest side across the stand
        pad.data.transform(Matrix.Rotation(math.pi / 2, 4, "Z"))
    pad.data.transform(Matrix.Translation(Vector(CONTROLLER_ON_STAND)) @ Matrix.Rotation(CONTROLLER_TILT, 4, "Y"))
    pad.data.update()
    log("Table size", [round(v, 3) for v in floor_centre(table)])
    for mat in bpy.data.materials:
        if mat.node_tree and mat.name == "Material.001":
            mat.name = "ControllerShell"
            unlink_input(mat, "Normal")
            drop_unused_image_nodes(mat)
    shrink_images(lambda img: 512)
    part1 = save_blend("gaming-1.blend")

    # --- the stand: a photo-scan with an unlit material, rebuilt so the room's lights affect it
    reset()
    import_glb(os.path.join(REFS, GAMING, "bomb_monkey.glb"), weld=True)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    for o in meshes:
        decimate(o, 0.16)
    stand = join(meshes, "ControllerStand")
    keep_only([stand])
    smooth(stand, 180)
    log("Stand size", [round(v, 3) for v in floor_centre(stand)])
    image = max(bpy.data.images, key=lambda i: i.size[0])
    lit = bpy.data.materials.new("StandScan")
    lit.use_nodes = True
    b = principled(lit)
    tex = lit.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = image
    lit.node_tree.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.55
    stand.data.materials.clear()
    stand.data.materials.append(lit)
    shrink_images(lambda img: 1024)
    part2 = save_blend("gaming-2.blend")

    # --- console
    reset()
    import_glb(os.path.join(REFS, GAMING, "ps5.glb"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    console = join(meshes, "Console")
    keep_only([console])
    lo, hi = bounds([console])
    transform_all([console], Matrix.Scale(0.39 / (hi.z - lo.z), 4))  # 39 cm tall
    smooth(console, 30)
    log("Console size", [round(v, 3) for v in floor_centre(console)])

    objs = [console] + [o for p in (part1, part2) for o in append_objects(p) if o.type == "MESH"]
    by_name = {o.name: o for o in objs}
    # The controller sits on the stand, so they travel as one object.
    stand_set = join([by_name["ControllerStand"], by_name["Controller"]], "ControllerStand")
    shrink_images(lambda img: 1024 if img.size[0] > 4000 else 512)  # the stand's scan keeps more detail
    export([by_name["Table"], stand_set, console], "gaming.glb")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(TMP, "gaming-final.blend"), copy=True)


# ---------------------------------------------------------------- monitor
# "Ultrawide Monitor" by dylanheyes (CC BY 4.0).
def prepare_monitor():
    reset()
    import_glb(os.path.join(REFS, "New ref", "ultrawide_monitor.glb"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    for o in meshes:
        if tri_count(o) > 2000:
            decimate(o, 0.045)
    for mat in bpy.data.materials:
        if mat.name == "Screen":  # replaced by a live canvas in the room
            for s in ("Base Color", "Emission Color"):
                unlink_input(mat, s)
            drop_unused_image_nodes(mat)
        elif mat.name == "Body":
            mat.name = "MonitorBody"
        elif mat.name == "Lights":
            mat.name = "MonitorLights"
    monitor = join(meshes, "Monitor")
    keep_only([monitor])
    smooth(monitor, 35)
    lo, hi = bounds([monitor])
    transform_all([monitor], Matrix.Scale(0.82 / (hi.x - lo.x), 4))  # a 34-inch ultrawide is about 82 cm across
    log("Monitor size", [round(v, 3) for v in floor_centre(monitor)])
    shrink_images(lambda img: 512)
    export([monitor], "monitor.glb")


# ---------------------------------------------------------------- plants
# "Monstera Deliciosa Potted Mid-Century plant" by Giora (CC BY 4.0); ZZ plant and pothos from the New ref archives.
def image_material(name, image, alpha=False, roughness=0.6):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = principled(mat)
    tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = image
    mat.node_tree.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    if alpha:
        mat.node_tree.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
    b.inputs["Roughness"].default_value = roughness
    mat.use_backface_culling = False
    return mat


def prepare_plants():
    # --- monstera
    reset()
    import_glb(os.path.join(REFS, "New ref", "monstera_deliciosa_potted_mid-century_plant.glb"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    monstera = join(meshes, "Monstera")
    keep_only([monstera])
    log("Monstera size", [round(v, 3) for v in floor_centre(monstera)])
    shrink_images(lambda img: 1024 if any(m.name == "Mat.1" and any(n.type == "TEX_IMAGE" and n.image == img for n in m.node_tree.nodes) for m in bpy.data.materials if m.node_tree) else 512)
    for mat in bpy.data.materials:
        if mat.name == "Mat.1":
            mat.name = "MonsteraLeaf"
    part1 = save_blend("plants-1.blend")

    # --- ZZ plant
    reset()
    import_glb(os.path.join(EXTRACTED, "zz-plant", "source", "ZZPlant.glb"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    zz = join(meshes, "ZZPlant")
    keep_only([zz])
    log("ZZ plant size", [round(v, 3) for v in floor_centre(zz)])
    shrink_images(lambda img: 512)
    part2 = save_blend("plants-2.blend")

    # --- pothos: an FBX whose textures sit beside it, so its materials are rebuilt here
    reset()
    folder = os.path.join(EXTRACTED, "pothos")
    bpy.ops.wm.fbx_import(filepath=os.path.join(folder, "source", "POTHOS.fbx"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    tex = lambda name: bpy.data.images.load(os.path.join(folder, "textures", name))
    diffuse, opacity = tex("POTHOS_DIFFUSE.jpeg"), tex("POTHOS_OPACITY.jpeg")
    w, h = diffuse.size
    if tuple(opacity.size) != (w, h):
        opacity.scale(w, h)
    px = np.array(diffuse.pixels[:], dtype=np.float32).reshape(-1, 4)
    px[:, 3] = np.array(opacity.pixels[:], dtype=np.float32).reshape(-1, 4)[:, 0]
    leaf = bpy.data.images.new("PothosLeaf", w, h, alpha=True)
    leaf.pixels = px.ravel()
    leaf.filepath_raw = os.path.join(TMP, "pothos-leaf.png")
    leaf.file_format = "PNG"
    leaf.save()
    leaf_mat = image_material("PothosLeaf", leaf, alpha=True, roughness=0.5)
    pot_mat = image_material("PothosPot", tex("POT02_WOODLEGS_Base_Color.png"))
    for o in meshes:
        is_leaf = any(m and m.name.startswith("POTHOS") for m in o.data.materials)
        o.data.materials.clear()
        o.data.materials.append(leaf_mat if is_leaf else pot_mat)
    pothos = join(meshes, "Pothos")
    keep_only([pothos])
    log("Pothos size", [round(v, 3) for v in floor_centre(pothos)])
    for img in (diffuse, opacity):
        bpy.data.images.remove(img)

    objs = [pothos] + [o for p in (part1, part2) for o in append_objects(p) if o.type == "MESH"]
    shrink_images(lambda img: 1024 if img.name.startswith("PothosLeaf") or img.size[0] > 1024 else img.size[0])
    export(objs, "plants.glb")


# ---------------------------------------------------------------- greenhouse
# From New ref/greenhouse-in-the-garden-draft.zip. Only the building, its paving, lamp and roof vine are kept:
# the grass, bushes and trees around it are over two million triangles.
GREENHOUSE_KEEP = {"rama", "fenster", "GL1", "GL2", "GL3", "h1", "h2", "h3", "sch1", "dwer", "dno", "lambert3", "lampada", "rama2", "kirp1", "kirp2", "kirp3", "lambert1", "vino9", "vino10", "vino11", "vino12", "setka2"}
GREENHOUSE_WIDTH = 2.9  # metres across, paving included


def prepare_greenhouse():
    reset()
    bpy.ops.wm.fbx_import(filepath=os.path.join(EXTRACTED, "greenhouse", "source", "20231011orange_d_render.fbx"))
    short = lambda m: m.name.split("__")[-1]
    meshes = []
    for o in bpy.data.objects:
        mats = [m for m in o.data.materials if m] if o.type == "MESH" else []
        if mats and all(short(m) in GREENHOUSE_KEEP for m in mats):
            meshes.append(o)
    keep_only(meshes)
    unparent(meshes)
    for o in meshes:
        names = {short(m) for m in o.data.materials if m}
        n = tri_count(o)
        if names & {"vino9", "vino10", "vino11", "vino12"}:
            decimate(o, 0.3)
        elif names & {"kirp1", "kirp2", "kirp3"} and n > 2000:
            decimate(o, 0.25)
        elif n > 1500:
            decimate(o, 0.5)
    for mat in bpy.data.materials:
        name = short(mat)
        if name == "fenster":
            mat.name = "GreenhouseGlass"
        elif name == "lampada":
            mat.name = "GreenhouseLamp"
    house = join(meshes, "Greenhouse")
    keep_only([house])
    smooth(house, 30)
    lo, hi = bounds([house])
    transform_all([house], Matrix.Scale(GREENHOUSE_WIDTH / max(hi.x - lo.x, hi.y - lo.y), 4))
    log("Greenhouse size", [round(v, 3) for v in floor_centre(house)])
    export([house], "greenhouse.glb")


# ---------------------------------------------------------------- garden: trees and grass
# "Simple grass chunks" by 3dhdscan (CC BY 4.0); two trees from New ref/Grass and grass land/low-poly-tree-scene-free.zip.
def prepare_garden():
    # --- trees: the first of each kind in the scene's "Trees" collection
    bpy.ops.wm.open_mainfile(filepath=os.path.join(EXTRACTED, "trees", "source", "LowPolyTrees.blend"), use_scripts=False)
    try:
        bpy.ops.file.find_missing_files(directory=os.path.join(EXTRACTED, "trees", "textures"))
    except Exception as e:
        log("  find_missing_files:", e)
    trees = []
    for name, parts in (("TreeA", ("Leaves", "Bark.001")), ("TreeB", ("Leaves.001", "Bark"))):
        objs = [bpy.data.objects[p] for p in parts]
        for o in objs:
            for c in list(o.users_collection):
                c.objects.unlink(o)
            bpy.context.scene.collection.objects.link(o)
        unparent(objs)
        tree = join(objs, name)
        log(name, "size", [round(v, 3) for v in floor_centre(tree)])
        trees.append(tree)
    keep_only(trees)
    for mat in bpy.data.materials:
        if not mat.node_tree:
            continue
        if mat.name.startswith("Leaves"):
            mat.name = "TreeLeaves"
        elif mat.name.startswith("Bark"):
            mat.name = "TreeBark"
        unlink_input(mat, "Normal")
        drop_unused_image_nodes(mat)
    shrink_images(lambda img: 512)
    part = save_blend("garden-trees.blend")

    # --- grass: one clump and one small tuft, to be scattered by the room
    reset()
    import_glb(os.path.join(REFS, "New ref", "Grass and grass land", "simple_grass_chunks.glb"))
    picked = []
    for name, prefix in (("GrassClump", "rostlinka_07c_rostlinka"), ("GrassTuft", "r12_a_")):
        o = next(o for o in bpy.data.objects if o.type == "MESH" and o.name.startswith(prefix))
        unparent([o])
        o = join([o], name)
        log(name, "size", [round(v, 3) for v in floor_centre(o)])
        o.data.materials[0].name = name
        picked.append(o)
    keep_only(picked)
    for mat in bpy.data.materials:
        if mat.node_tree:
            unlink_input(mat, "Normal")
            drop_unused_image_nodes(mat)
    objs = picked + [o for o in append_objects(part) if o.type == "MESH"]
    shrink_images(lambda img: 512)
    export(objs, "garden.glb")


# ---------------------------------------------------------------- furniture: sofa, arcade, mug, bookshelf, PC
# All in real metres, standing on the origin; the room places and scales them.
MORE = os.path.join("New ref", "more")
SITE = {"ink": (0.06, 0.07, 0.12), "volt": (0.03, 0.06, 1.0), "sand": (1.0, 0.64, 0.35), "cream": (0.93, 0.9, 0.84)}
BOOK_COLOURS = [(0.03, 0.06, 1.0), (0.85, 0.25, 0.12), (0.05, 0.35, 0.2), (0.95, 0.78, 0.55), (0.12, 0.13, 0.2), (0.6, 0.64, 0.95), (0.95, 0.5, 0.3), (0.9, 0.9, 0.88)]


def flat_material(name, rgb, roughness=0.6, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = principled(mat)
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = roughness
    b.inputs["Metallic"].default_value = metallic
    return mat


def set_material(o, mat):
    o.data.materials.clear()
    o.data.materials.append(mat)


def budget(objs, total_tris):
    """Decimate the heavy objects so the set comes in near total_tris."""
    total = sum(tri_count(o) for o in objs)
    if total <= total_tris:
        return
    big = [o for o in objs if tri_count(o) > 300]
    small = total - sum(tri_count(o) for o in big)
    ratio = max(0.03, (total_tris - small) / max(1, total - small))
    for o in big:
        decimate(o, ratio)


def save_part(objs, name):
    keep_only(objs)
    return save_blend(name)


def prepare_furniture():
    parts = []

    # --- sofa: "Sofa" by AngelNebesniy (CC BY 4.0), modelled in centimetres
    reset()
    import_glb(os.path.join(REFS, MORE, "sofa.glb"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    sofa = join(meshes, "Sofa")
    budget([sofa], 9000)
    lo, hi = bounds([sofa])
    transform_all([sofa], Matrix.Scale(2.6 / (hi.x - lo.x), 4))  # 2.6 m long
    log("Sofa size", [round(v, 3) for v in floor_centre(sofa)])
    for mat in bpy.data.materials:
        if mat.node_tree:
            mat.name = "SofaFabric" if mat.name == "Material" else mat.name
    shrink_images(lambda img: 1024)
    parts.append(save_part([sofa], "furniture-sofa.blend"))

    # --- arcade: "Game-ready arcade machine" by Snji (CC BY 4.0). Its side art and screen are repainted
    # (scripts/room-assets/repaint-arcade.mjs), so no third-party artwork ships with the room.
    reset()
    import_glb(os.path.join(REFS, MORE, "game-ready_arcade_machine.glb"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    arcade = join(meshes, "Arcade")
    for mat in bpy.data.materials:
        b = principled(mat)
        if not b:
            continue
        mat.name = "ArcadeBody"
        for socket, file in (("Base Color", "base-new.png"), ("Emission Color", "emit-new.png")):
            for link in b.inputs[socket].links:
                node = link.from_node
                while node.type != "TEX_IMAGE" and node.inputs and node.inputs[0].links:
                    node = node.inputs[0].links[0].from_node
                if node.type == "TEX_IMAGE":
                    node.image = bpy.data.images.load(os.path.join(EXTRACTED, "arcade", file))
        if "Emission Strength" in b.inputs:
            b.inputs["Emission Strength"].default_value = 2.5
    lo, hi = bounds([arcade])
    transform_all([arcade], Matrix.Scale(1.78 / (hi.z - lo.z), 4))  # 1.78 m tall
    log("Arcade size", [round(v, 3) for v in floor_centre(arcade)])
    shrink_images(lambda img: 1024)
    parts.append(save_part([arcade], "furniture-arcade.blend"))

    # --- mug: "Coffee Mug (School Project)" by Ole Gunnar Isager (CC BY 4.0)
    reset()
    import_glb(os.path.join(REFS, "New ref", "coffee_mug_school_project.glb"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    mug = join(meshes, "Mug")
    lo, hi = bounds([mug])
    transform_all([mug], Matrix.Scale(0.1 / (hi.z - lo.z), 4))  # 10 cm tall
    log("Mug size", [round(v, 3) for v in floor_centre(mug)])
    for mat in bpy.data.materials:
        if mat.name == "material":
            mat.name = "MugCeramic"
    shrink_images(lambda img: 256)
    parts.append(save_part([mug], "furniture-mug.blend"))

    # --- bookshelf: the "metal shelf" OBJ, modelled in centimetres. Its materials are viewport colours, so the
    # frame, boards, books and vases are recoloured here: black steel, oak boards, books in the site palette.
    reset()
    bpy.ops.wm.obj_import(filepath=os.path.join(EXTRACTED, "shelf", "metal shelf o.obj"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    steel = flat_material("ShelfSteel", (0.04, 0.04, 0.045), 0.45, 0.8)
    oak = flat_material("ShelfOak", (0.55, 0.36, 0.2), 0.6)
    pages = flat_material("BookPages", SITE["cream"], 0.8)
    books = [flat_material(f"Book{i}", c, 0.7) for i, c in enumerate(BOOK_COLOURS)]
    vases = [flat_material("VaseA", SITE["sand"], 0.3), flat_material("VaseB", SITE["volt"], 0.3), flat_material("VaseC", SITE["cream"], 0.3)]
    frame = None
    n_book = n_vase = 0
    for o in meshes:
        name = o.name.lower()
        if name.startswith("metal_shelf"):
            frame = o
        elif "cover" in name:
            set_material(o, books[n_book % len(books)])
            n_book += 1
        elif "page" in name:
            set_material(o, pages)
        elif "vase" in name:
            set_material(o, vases[n_vase % len(vases)])
            n_vase += 1
    # Boards are the flat, wide loose parts of the frame.
    with_active(frame, lambda: (bpy.ops.object.mode_set(mode="EDIT"), bpy.ops.mesh.select_all(action="SELECT"), bpy.ops.mesh.separate(type="LOOSE"), bpy.ops.object.mode_set(mode="OBJECT")))
    pieces = [o for o in bpy.data.objects if o.type == "MESH" and o.name.lower().startswith("metal_shelf")]
    for o in pieces:
        lo, hi = bounds([o])
        size = hi - lo
        flat = min(size) < 4 and sorted(size)[1] > 15 and max(size) > 40
        set_material(o, oak if flat else steel)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    unparent(meshes)
    budget(meshes, 14000)
    shelf = join(meshes, "Bookshelf")
    transform_all([shelf], Matrix.Scale(0.01, 4))
    smooth(shelf, 35)
    log("Bookshelf size", [round(v, 3) for v in floor_centre(shelf)])
    parts.append(save_part([shelf], "furniture-shelf.blend"))

    # --- PC: the "Custom gaming PC" .blend. Product photos and brand logos on its parts are dropped;
    # only the generic RGB fan textures are kept.
    bpy.ops.wm.open_mainfile(filepath=os.path.join(REFS, MORE, "CUSTOM+GAMING+PC(1).blend"), use_scripts=False)
    for o in list(bpy.data.objects):
        if o.type not in {"MESH", "CURVE"} or o.name in {"Cube", "Cube.091"}:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in [o for o in bpy.data.objects if o.type == "CURVE"]:
        with_active(o, lambda: bpy.ops.object.convert(target="MESH"))
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and len(o.data.polygons)]
    keep_only(meshes)
    for o in list(meshes):
        if not o.visible_get():
            meshes.remove(o)
            bpy.data.objects.remove(o, do_unlink=True)
    for o in meshes:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        bpy.context.scene.collection.objects.link(o)
    unparent(meshes)
    for o in meshes:
        with_active(o, lambda: bpy.ops.object.convert(target="MESH"))  # applies modifiers
    for o in meshes:
        if o.data.users > 1:
            o.data = o.data.copy()
        with_active(o, lambda: bpy.ops.object.transform_apply(location=False, rotation=True, scale=True))
    keep_images = ("RGB_TEXTURE", "case fan")
    for mat in bpy.data.materials:
        if not mat.node_tree:
            continue
        for n in list(mat.node_tree.nodes):
            if n.type == "TEX_IMAGE" and not (n.image and n.image.name.startswith(keep_images)):
                mat.node_tree.nodes.remove(n)
        drop_unused_image_nodes(mat)
    # The perforated mesh panels are hundreds of thousands of triangles of tiny holes: each becomes one thin
    # dark sheet, which reads the same from across the room.
    grille = flat_material("PCGrille", (0.02, 0.02, 0.025), 0.5, 0.6)
    for o in meshes:
        lo, hi = bounds([o])
        if tri_count(o) > 5000 and min(hi - lo) < 0.02:
            import bmesh

            bm = bmesh.new()
            bmesh.ops.create_cube(bm, size=1.0)
            bm.to_mesh(o.data)
            bm.free()
            size = hi - lo
            o.data.transform(Matrix.Translation(((lo + hi) / 2) - o.location) @ Matrix.Diagonal((max(size.x, 0.005), max(size.y, 0.005), max(size.z, 0.005), 1)))
            o.data.update()
            set_material(o, grille)
            log("  replaced grille", o.name)
    budget(meshes, 30000)
    pc = join(meshes, "PC")
    lo, hi = bounds([pc])
    transform_all([pc], Matrix.Scale(0.47 / (hi.z - lo.z), 4))  # a mid tower, 47 cm tall
    smooth(pc, 30)
    log("PC size", [round(v, 3) for v in floor_centre(pc)], "materials", len(pc.data.materials))
    shrink_images(lambda img: 512)
    parts.append(save_part([pc], "furniture-pc.blend"))

    reset()
    objs = [o for p in parts for o in append_objects(p) if o.type == "MESH"]
    # Shrunk images are not saved into the part files, so the sizes are set again here.
    shrink_images(lambda img: 1024 if img.name.startswith("base-new") else 512 if img.size[0] <= 1024 else 768)
    export(objs, "furniture.glb")


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)
    only = os.environ.get("ROOM_ASSETS_ONLY")
    for step in (prepare_setup, prepare_monitor, prepare_laptop, prepare_vine, prepare_gaming, prepare_plants, prepare_greenhouse, prepare_garden, prepare_furniture):
        if only and step.__name__ != only:
            continue
        try:
            step()
        except Exception:
            log(step.__name__, "FAILED\n" + traceback.format_exc())
    log("finished")


try:
    main()
finally:
    if LOG:
        LOG.close()
    if DONE:
        open(DONE, "w").write("done")
