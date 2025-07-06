"use client"

import DashboardHeader from "@/components/dashboard/dashboard-header"

export default function GalleryPageClient() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <main className="flex-1 container py-10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {/* <img src="/images/dha.png" alt="DHA Logo" className="h-16" /> */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Media Gallery</h1>
              <p className="text-muted-foreground mt-2">Explore images of our developments and facilities</p>
            </div>
          </div>

          <div className="gallery-container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Image 1 */}
              <div className="gallery-item">
                <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                  <img
                    src="/images/gallery/dha-gate-night.jpg"
                    alt="DHA Phase 4 Entrance Gate at night"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-lg">DHA Phase 4 Entrance</h3>
                  <p className="text-sm text-gray-600">Iconic entrance gate with modern architecture</p>
                </div>
              </div>

              {/* Image 2 */}
              <div className="gallery-item">
                <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                  <img
                    src="/images/gallery/dha-medical-center.jpg"
                    alt="DHA Medical Center"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-lg">DHA Medical Center</h3>
                  <p className="text-sm text-gray-600">State-of-the-art healthcare facility</p>
                </div>
              </div>

              {/* Image 3 */}
              <div className="gallery-item">
                <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                  <img
                    src="/images/gallery/dha-commercial-center.jpg"
                    alt="DHA Commercial Center"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-lg">Commercial Hub</h3>
                  <p className="text-sm text-gray-600">Aerial view of the circular commercial center</p>
                </div>
              </div>

              {/* Image 4 */}
              <div className="gallery-item">
                <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                  <img
                    src="/images/gallery/dha-sports-facility.jpg"
                    alt="DHA Sports Facility"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-lg">Sports Complex</h3>
                  <p className="text-sm text-gray-600">Modern football grounds with night lighting</p>
                </div>
              </div>

              {/* Image 5 */}
              <div className="gallery-item">
                <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                  <img
                    src="/images/gallery/dha-mosque-night.jpg"
                    alt="DHA Grand Mosque"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-lg">Grand Mosque</h3>
                  <p className="text-sm text-gray-600">Beautifully illuminated mosque with golden dome</p>
                </div>
              </div>

              {/* Image 6 */}
              <div className="gallery-item">
                <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                  <img
                    src="/images/gallery/imperial-hall.jpg"
                    alt="Imperial Hall"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-lg">Imperial Hall</h3>
                  <p className="text-sm text-gray-600">Modern community center and event venue</p>
                </div>
              </div>

              {/* Image 7 */}
              <div className="gallery-item">
                <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                  <img
                    src="/images/gallery/dha-park-night.jpg"
                    alt="DHA Park at Night"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-2">
                  <h3 className="font-semibold text-lg">Community Park</h3>
                  <p className="text-sm text-gray-600">Illuminated recreational area with walking paths</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">© 2025 Defence Housing Authority. All rights reserved.</p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .gallery-item {
          transition: transform 0.3s ease;
        }
        
        .gallery-item:hover {
          transform: translateY(-5px);
        }
        
        @media (min-width: 768px) {
          .gallery-container {
            scroll-behavior: smooth;
          }
        }
      `}</style>
    </div>
  )
}
