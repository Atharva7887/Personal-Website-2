export function renderCertificateCard(cert: Certificate): HTMLElement {
  const card = document.createElement('div');
  card.className = 'certification-card bg-gray-800/80 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-300';
  
  card.innerHTML = `
    <div class="h-48 overflow-hidden">
      <img
        src="${cert.imagePath}"
        alt="${cert.organization} - ${cert.title}"
        class="certification-image w-full h-full object-contain p-4"
        loading="lazy"
      />
    </div>
    <div class="p-6">
      <h3 class="text-xl font-semibold mb-2 text-white">${cert.title}</h3>
      <p class="text-gray-300 mb-4">${cert.organization}</p>
      <span class="inline-block bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
        Certificate
      </span>
    </div>
  `;
  
  return card;
}