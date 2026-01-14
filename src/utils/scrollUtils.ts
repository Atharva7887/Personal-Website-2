export function smoothScroll(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const offset = 80; // Account for fixed header
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}