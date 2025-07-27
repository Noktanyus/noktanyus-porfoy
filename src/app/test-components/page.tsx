'use client';

import React from 'react';
import { FaHome, FaUser, FaCog, FaHeart, FaGithub, FaPlay, FaProjectDiagram, FaBlog, FaEnvelope, FaPlus } from 'react-icons/fa';

export default function TestComponentsPage() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="container-responsive py-8">
        <div className="admin-container">
          {/* Header Section */}
          <div className="admin-header">
            <div>
              <h1 className="admin-title">Tailwind Component Showcase</h1>
              <p className="admin-subtitle">Profesyonel component sistemi - Tüm bileşenlerin canlı demo'su</p>
            </div>
          </div>

          {/* Quick Stats Demo */}
          <div className="admin-grid mb-8">
            <div className="admin-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <FaProjectDiagram className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="admin-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Blog Posts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">18</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <FaBlog className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="admin-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">7</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <FaEnvelope className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Layout Components Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">📐 Layout & Typography Components</h2>
            </div>
            <div className="admin-section-content">
              <div className="space-responsive">
                <div className="prose">
                  <h1>Prose H1 Başlık - Responsive Typography</h1>
                  <h2>Prose H2 Alt Başlık</h2>
                  <p>Bu bir prose paragrafıdır. Responsive typography ile otomatik olarak boyutlandırılır ve tüm ekran boyutlarında mükemmel görünür.</p>
                  <p className="line-clamp-2">Bu çok uzun bir metin örneğidir. Line clamp ile sadece 2 satır gösterilecek ve geri kalanı gizlenecek. Bu özellik özellikle kart bileşenlerinde çok kullanışlıdır ve kullanıcı deneyimini iyileştirir.</p>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-responsive-heading mb-2">Responsive Heading</h3>
                    <p className="text-responsive-body">Responsive body text that adapts beautifully to all screen sizes.</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-heading-responsive-lg mb-2">Large Responsive Heading</h3>
                    <p className="text-caption-responsive">Caption text that scales appropriately</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animation Components Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">✨ Animation Components</h2>
            </div>
            <div className="admin-section-content">
              <div className="admin-grid">
                <div className="admin-card floating-element">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaPlay className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Floating Animation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Yumuşak yukarı-aşağı hareket</p>
                  </div>
                </div>
                <div className="admin-card fade-in">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaHeart className="text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Fade In Animation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Yumuşak görünme efekti</p>
                  </div>
                </div>
                <div className="admin-card scale-in">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaCog className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Scale In Animation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Büyüme efekti ile giriş</p>
                  </div>
                </div>
                <div className="admin-card slide-in-left">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaUser className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Slide Left Animation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Soldan kayarak giriş</p>
                  </div>
                </div>
                <div className="admin-card slide-in-right">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaHome className="text-pink-600 dark:text-pink-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Slide Right Animation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sağdan kayarak giriş</p>
                  </div>
                </div>
                <div className="admin-card glow-blue">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaGithub className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Glow Animation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mavi ışıltı efekti</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Components Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🎴 Card Components</h2>
            </div>
            <div className="admin-section-content">
              <div className="admin-grid">
                <div className="card-professional">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                        <FaProjectDiagram className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Professional Card</h3>
                        <p className="text-sm text-gray-500">Premium hover effects</p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Hover efekti ile yukarı kalkar ve gölgesi artar. Profesyonel görünüm için tasarlandı.</p>
                  </div>
                </div>
                <div className="admin-card">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                      <FaCog className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Admin Card</h3>
                      <p className="text-sm text-gray-500">Standard admin style</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Standart admin panel kartı. Temiz ve minimal tasarım.</p>
                </div>
                <div className="card-responsive">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                      <FaUser className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Responsive Card</h3>
                      <p className="text-sm text-gray-500">Adaptive padding</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Ekran boyutuna göre padding'i değişir. Mobil-first yaklaşım.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Button Components Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🔘 Button Components</h2>
            </div>
            <div className="admin-section-content">
              <div className="space-y-8">
                {/* Admin Buttons */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Admin Button Variants
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <button className="admin-btn admin-btn-primary">
                      <FaPlus className="mr-2" />
                      Primary Action
                    </button>
                    <button className="admin-btn admin-btn-secondary">
                      <FaUser className="mr-2" />
                      Secondary Action
                    </button>
                    <button className="admin-btn admin-btn-danger">
                      <FaCog className="mr-2" />
                      Danger Action
                    </button>
                    <button className="admin-btn admin-btn-success">
                      <FaHeart className="mr-2" />
                      Success Action
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Touch-optimized with 44px minimum height, hover effects, and focus states</p>
                </div>

                {/* Animated Buttons */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Animated Buttons
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <button className="btn-animated admin-btn admin-btn-primary">
                      <FaPlay className="mr-2" />
                      Animated Hover
                    </button>
                    <button className="btn-touch bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <FaHome className="mr-2" />
                      Touch Optimized
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Shimmer effect on hover and optimized for touch devices</p>
                </div>

                {/* Expandable Buttons */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Expandable Buttons
                  </h3>
                  <div className="flex gap-4">
                    <button className="btn-expandable btn-demo bg-blue-600 text-white rounded-lg shadow-lg">
                      <span className="btn-icon">
                        <FaPlay />
                      </span>
                      <span className="btn-text-expand">Demo</span>
                    </button>
                    <button className="btn-expandable btn-github bg-gray-800 text-white rounded-lg shadow-lg">
                      <span className="btn-icon">
                        <FaGithub />
                      </span>
                      <span className="btn-text-expand">GitHub</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Hover to expand and reveal text labels</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Components Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">📝 Form Components</h2>
            </div>
            <div className="admin-section-content">
              <div className="space-y-6">
                <div className="admin-form-grid">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Admin Input Field
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Enter your text here..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Touch-optimized with focus states</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Admin Select Dropdown
                    </label>
                    <select className="admin-input admin-select">
                      <option>Choose an option...</option>
                      <option>Option 1</option>
                      <option>Option 2</option>
                      <option>Option 3</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Styled select dropdown</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Admin Textarea
                  </label>
                  <textarea
                    className="admin-input admin-textarea"
                    placeholder="Enter your message here..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">Resizable textarea with minimum height</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Responsive Form Input
                  </label>
                  <input
                    type="email"
                    className="form-input-responsive"
                    placeholder="responsive@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Adapts padding based on screen size</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button className="admin-btn admin-btn-primary">
                    <FaPlus className="mr-2" />
                    Submit Form
                  </button>
                  <button className="admin-btn admin-btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Components Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🏷️ Status Components</h2>
            </div>
            <div className="admin-section-content">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Status Badges</h3>
                  <div className="flex flex-wrap gap-3">
                    <span className="admin-status-active">✅ Active</span>
                    <span className="admin-status-inactive">❌ Inactive</span>
                    <span className="admin-status-pending">⏳ Pending</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Usage Examples</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Project Status:</span>
                      <span className="admin-status-active">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Account:</span>
                      <span className="admin-status-pending">Pending Verification</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Service:</span>
                      <span className="admin-status-inactive">Maintenance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🔤 Responsive Typography</h2>
            </div>
            <div className="admin-section-content">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-responsive-display mb-2">Responsive Display</div>
                  <p className="text-caption-responsive">Scales from 3xl to 6xl across breakpoints</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                    <div className="text-responsive-heading mb-2">Responsive Heading</div>
                    <div className="text-responsive-body">This body text adapts beautifully to all screen sizes, ensuring optimal readability across devices.</div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <div className="text-heading-responsive-lg mb-2">Large Heading</div>
                    <div className="text-body-responsive-md mb-2">Medium body text with perfect line height and spacing.</div>
                    <div className="text-caption-responsive">Caption text for additional context</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Typography Scale Demo</h3>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold">Display Text (3xl)</div>
                    <div className="text-2xl font-semibold">Heading 1 (2xl)</div>
                    <div className="text-xl font-semibold">Heading 2 (xl)</div>
                    <div className="text-lg font-medium">Heading 3 (lg)</div>
                    <div className="text-base">Body Text (base)</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Small Text (sm)</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Caption Text (xs)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stagger Animation Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🎭 Stagger Animation</h2>
            </div>
            <div className="admin-section-content">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Items animate in sequence with staggered delays (0.1s intervals)
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="stagger-item admin-card">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 mr-2">1</span>
                    <h3 className="font-semibold">First Item</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Animates first (0.1s delay)</p>
                </div>
                <div className="stagger-item admin-card">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400 mr-2">2</span>
                    <h3 className="font-semibold">Second Item</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Animates second (0.2s delay)</p>
                </div>
                <div className="stagger-item admin-card">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 mr-2">3</span>
                    <h3 className="font-semibold">Third Item</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Animates third (0.3s delay)</p>
                </div>
                <div className="stagger-item admin-card">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 mr-2">4</span>
                    <h3 className="font-semibold">Fourth Item</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Animates fourth (0.4s delay)</p>
                </div>
                <div className="stagger-item admin-card">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center text-xs font-bold text-pink-600 dark:text-pink-400 mr-2">5</span>
                    <h3 className="font-semibold">Fifth Item</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Animates fifth (0.5s delay)</p>
                </div>
                <div className="stagger-item admin-card">
                  <div className="flex items-center mb-2">
                    <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-2">6</span>
                    <h3 className="font-semibold">Sixth Item</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Animates last (0.6s delay)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Components Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🖼️ Image Components</h2>
            </div>
            <div className="admin-section-content">
              <div className="admin-grid">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Hover Scale Effect</h3>
                  <div className="image-hover">
                    <div className="bg-gradient-to-br from-blue-400 to-purple-600 h-48 flex items-center justify-center text-white font-semibold text-lg">
                      <div className="text-center">
                        <FaProjectDiagram className="text-3xl mb-2 mx-auto" />
                        Hover to Scale
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Image scales 1.1x on hover with smooth transition</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Responsive Container</h3>
                  <div className="image-container-responsive aspect-video">
                    <div className="bg-gradient-to-br from-green-400 to-blue-600 h-full flex items-center justify-center text-white font-semibold text-lg">
                      <div className="text-center">
                        <FaBlog className="text-3xl mb-2 mx-auto" />
                        Responsive Container
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Maintains aspect ratio across all screen sizes</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Professional Card Image</h3>
                  <div className="card-professional">
                    <div className="p-0">
                      <div className="bg-gradient-to-br from-orange-400 to-red-600 h-32 flex items-center justify-center text-white font-semibold">
                        <FaHeart className="text-2xl" />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold mb-1">Card with Image</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Professional card styling with image header</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Utility Classes Test */}
          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">🛠️ Utility Classes</h2>
            </div>
            <div className="admin-section-content">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Touch Target</h3>
                  <div className="touch-target bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-800 dark:text-blue-200 font-medium">
                    44px Minimum Touch Target
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Ensures accessibility compliance with minimum touch target size</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Focus Ring</h3>
                  <button className="focus-ring admin-btn admin-btn-primary">
                    <FaCog className="mr-2" />
                    Focus Ring Test (Tab to see)
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Keyboard navigation with visible focus indicators</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Responsive Grid</h3>
                  <div className="grid-responsive-cards">
                    <div className="admin-card text-center">
                      <FaHome className="text-2xl text-blue-500 mx-auto mb-2" />
                      <h4 className="font-semibold">Grid Item 1</h4>
                    </div>
                    <div className="admin-card text-center">
                      <FaUser className="text-2xl text-green-500 mx-auto mb-2" />
                      <h4 className="font-semibold">Grid Item 2</h4>
                    </div>
                    <div className="admin-card text-center">
                      <FaCog className="text-2xl text-purple-500 mx-auto mb-2" />
                      <h4 className="font-semibold">Grid Item 3</h4>
                    </div>
                    <div className="admin-card text-center">
                      <FaHeart className="text-2xl text-red-500 mx-auto mb-2" />
                      <h4 className="font-semibold">Grid Item 4</h4>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">1 column on mobile, 2 on tablet, 3 on desktop, 4 on xl screens</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Line Clamp</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="line-clamp-2 text-sm">
                        Bu çok uzun bir metin örneğidir. Line clamp ile sadece 2 satır gösterilecek ve geri kalanı gizlenecek. Bu özellik özellikle kart bileşenlerinde çok kullanışlıdır ve kullanıcı deneyimini iyileştirir. Daha fazla metin burada devam ediyor ama görünmeyecek.
                      </p>
                      <span className="text-xs text-gray-500">2 line clamp</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="line-clamp-3 text-sm">
                        Bu da 3 satır için line clamp örneğidir. Metin uzun olduğunda otomatik olarak kesilir ve ... ile gösterilir. Bu özellik responsive tasarımda çok önemlidir. Kart boyutları sabit kalırken içerik kontrol altında tutulur. Daha fazla metin burada devam ediyor ama sadece 3 satır görünecek.
                      </p>
                      <span className="text-xs text-gray-500">3 line clamp</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="admin-section">
            <div className="admin-section-content">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  🎉 Component Showcase Complete!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Tüm component'lar başarıyla Tailwind CSS ile oluşturuldu ve test edildi.
                </p>
                <div className="flex justify-center gap-4">
                  <button className="admin-btn admin-btn-primary">
                    <FaGithub className="mr-2" />
                    View Source Code
                  </button>
                  <button className="admin-btn admin-btn-secondary">
                    <FaHome className="mr-2" />
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}