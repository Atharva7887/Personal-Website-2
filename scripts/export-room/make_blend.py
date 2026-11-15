"""Convert the exported room (.glb) into a native Blender file (.blend).

Usage (from the project folder, with Blender installed):
    blender --background --python scripts/export-room/make_blend.py -- exports/atharva-room-night.glb exports/atharva-room-night.blend
"""
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
src = args[0] if args else "exports/atharva-room-night.glb"
dst = args[1] if len(args) > 1 else src.rsplit(".", 1)[0] + ".blend"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

# A camera matching the site's overview shot, so F12 renders the same view.
cam_data = bpy.data.cameras.new("Overview")
cam_data.lens = 40
cam = bpy.data.objects.new("Overview camera", cam_data)
bpy.context.scene.collection.objects.link(cam)
cam.location = (9.5, -9.5, 8.2)  # glTF Y-up -> Blender Z-up
cam.rotation_euler = (1.02, 0, 0.785)
bpy.context.scene.camera = cam
bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys() else "BLENDER_EEVEE"

bpy.ops.wm.save_as_mainfile(filepath=dst)
print(f"Saved {dst}")
