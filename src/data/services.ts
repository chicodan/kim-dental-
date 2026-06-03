export function getLocalizedServices() {
  return [
    {
      slug: "general-dentistry",
      image: "/assets/images/service-general.svg",
      detailImage: "/assets/images/room-horizontal.jpg",
    },
    {
      slug: "hygiene",
      image: "/assets/images/service-cleaning.svg",
      detailImage: "/assets/images/room-horizontal.jpg",
    },
    {
      slug: "implants",
      image: "/assets/images/service-implants.svg",
      detailImage: "/assets/images/room-horizontal.jpg",
      companyLogo: "/assets/images/Hiossen-New-Logo.png",
    },
    {
      slug: "removable-prosthetics",
      image: "/assets/images/service-cosmetic.svg",
      detailImage: "/assets/images/room-horizontal.jpg",
    },
    {
      slug: "root-canal-therapy",
      image: "/assets/images/service-rootcanal.svg",
      detailImage: "/assets/images/room-horizontal.jpg",
    },
    {
      slug: "emergency-dentistry",
      image: "/assets/images/service-emergency.svg",
      detailImage: "/assets/images/room-horizontal.jpg",
    },
  ];
}

export function getServiceBySlug(slug: string) {
  const services = getLocalizedServices();
  return services.find((service) => service.slug === slug);
}

// Export a static list for components that need just the slugs
export const SERVICE_SLUGS = [
  "general-dentistry",
  "hygiene",
  "implants",
  "removable-prosthetics",
  "root-canal-therapy",
  "emergency-dentistry",
] as const;
