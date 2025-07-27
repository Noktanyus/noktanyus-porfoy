'use client';

import React from 'react';
import { FaHome, FaUser, FaCog, FaHeart, FaGithub, FaPlay } from 'react-icons/fa';

export default function TestComponentsPage() {
  return (
    <div className="container-responsive py-8">
      <div className="admin-container">
        {/* Header Section */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Tailwind Component Test</h1>
            <p className="admin-subtitle">Tüm custom component'ların test sayfası</p>
          </div>
        </div>

        {/* Layout Components Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Layout Components</h2>
          </div>
          <div className="admin-section-content">
            <div className="space-responsive">
              <div className="prose">
                <h1>Prose H1 Başlık</h1>
                <h2>Prose H2 Başlık</h2>
                <p>Bu bir prose paragrafıdır. Responsive typography ile otomatik olarak boyutlandırılır.</p>
                <p className="line-clamp-2">Bu çok uzun bir metin örneğidir. Line clamp ile sadece 2 satır gösterilecek ve geri kalanı gizlenecek. Bu özellik özellikle kart bileşenlerinde çok kullanışlıdır.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Animation Components Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Animation Components</h2>
          </div>
          <div className="admin-section-content">
            <div className="admin-grid">
              <div className="admin-card floating-element">
                <h3 className="text-lg font-semibold mb-2">Floating Animation</h3>
                <p>Bu kart yukarı aşağı hareket eder</p>
              </div>
              <div className="admin-card fade-in">
                <h3 className="text-lg font-semibold mb-2">Fade In Animation</h3>
                <p>Bu kart fade in efekti ile görünür</p>
              </div>
              <div className="admin-card scale-in">
                <h3 className="text-lg font-semibold mb-2">Scale In Animation</h3>
                <p>Bu kart scale efekti ile büyür</p>
              </div>
              <div className="admin-card slide-in-left">
                <h3 className="text-lg font-semibold mb-2">Slide Left Animation</h3>
                <p>Bu kart soldan kayar</p>
              </div>
              <div className="admin-card slide-in-right">
                <h3 className="text-lg font-semibold mb-2">Slide Right Animation</h3>
                <p>Bu kart sağdan kayar</p>
              </div>
              <div className="admin-card glow-blue">
                <h3 className="text-lg font-semibold mb-2">Glow Animation</h3>
                <p>Bu kart mavi ışıltı efekti ile parlar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card Components Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Card Components</h2>
          </div>
          <div className="admin-section-content">
            <div className="admin-grid">
              <div className="card-professional">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Professional Card</h3>
                  <p>Hover efekti ile yukarı kalkar ve gölgesi artar</p>
                </div>
              </div>
              <div className="admin-card">
                <h3 className="text-lg font-semibold mb-2">Admin Card</h3>
                <p>Standart admin panel kartı</p>
              </div>
              <div className="card-responsive">
                <h3 className="text-lg font-semibold mb-2">Responsive Card</h3>
                <p>Ekran boyutuna göre padding'i değişir</p>
              </div>
            </div>
          </div>
        </div>

        {/* Button Components Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Button Components</h2>
          </div>
          <div className="admin-section-content">
            <div className="space-y-6">
              {/* Admin Buttons */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Admin Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <button className="admin-btn admin-btn-primary">
                    <FaHome className="mr-2" />
                    Primary Button
                  </button>
                  <button className="admin-btn admin-btn-secondary">
                    <FaUser className="mr-2" />
                    Secondary Button
                  </button>
                  <button className="admin-btn admin-btn-danger">
                    <FaCog className="mr-2" />
                    Danger Button
                  </button>
                  <button className="admin-btn admin-btn-success">
                    <FaHeart className="mr-2" />
                    Success Button
                  </button>
                </div>
              </div>

              {/* Animated Buttons */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Animated Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-animated admin-btn admin-btn-primary">
                    <FaPlay className="mr-2" />
                    Animated Button
                  </button>
                  <button className="btn-touch bg-blue-600 text-white">
                    Touch Optimized
                  </button>
                </div>
              </div>

              {/* Expandable Buttons */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Expandable Buttons</h3>
                <div className="flex gap-4">
                  <button className="btn-expandable btn-demo bg-blue-600 text-white rounded-lg">
                    <span className="btn-icon">
                      <FaPlay />
                    </span>
                    <span className="btn-text-expand">Demo</span>
                  </button>
                  <button className="btn-expandable btn-github bg-gray-800 text-white rounded-lg">
                    <span className="btn-icon">
                      <FaGithub />
                    </span>
                    <span className="btn-text-expand">GitHub</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Components Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Form Components</h2>
          </div>
          <div className="admin-section-content">
            <div className="admin-form-grid">
              <div>
                <label className="block text-sm font-medium mb-2">Admin Input</label>
                <input 
                  type="text" 
                  className="admin-input" 
                  placeholder="Placeholder text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Admin Select</label>
                <select className="admin-input admin-select">
                  <option>Seçenek 1</option>
                  <option>Seçenek 2</option>
                  <option>Seçenek 3</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Admin Textarea</label>
                <textarea 
                  className="admin-input admin-textarea" 
                  placeholder="Textarea placeholder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Responsive Form Input</label>
                <input 
                  type="text" 
                  className="form-input-responsive" 
                  placeholder="Responsive input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Components Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Status Components</h2>
          </div>
          <div className="admin-section-content">
            <div className="flex flex-wrap gap-4">
              <span className="admin-status-active">Active Status</span>
              <span className="admin-status-inactive">Inactive Status</span>
              <span className="admin-status-pending">Pending Status</span>
            </div>
          </div>
        </div>

        {/* Typography Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Responsive Typography</h2>
          </div>
          <div className="admin-section-content">
            <div className="space-y-4">
              <div className="text-responsive-display">Responsive Display Text</div>
              <div className="text-responsive-heading">Responsive Heading Text</div>
              <div className="text-responsive-body">Responsive body text that adapts to screen size automatically.</div>
              <div className="text-heading-responsive-lg">Large Responsive Heading</div>
              <div className="text-body-responsive-md">Medium responsive body text</div>
              <div className="text-caption-responsive">Responsive caption text</div>
            </div>
          </div>
        </div>

        {/* Stagger Animation Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Stagger Animation</h2>
          </div>
          <div className="admin-section-content">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="stagger-item admin-card">
                <h3 className="font-semibold">Item 1</h3>
                <p>First stagger item</p>
              </div>
              <div className="stagger-item admin-card">
                <h3 className="font-semibold">Item 2</h3>
                <p>Second stagger item</p>
              </div>
              <div className="stagger-item admin-card">
                <h3 className="font-semibold">Item 3</h3>
                <p>Third stagger item</p>
              </div>
              <div className="stagger-item admin-card">
                <h3 className="font-semibold">Item 4</h3>
                <p>Fourth stagger item</p>
              </div>
              <div className="stagger-item admin-card">
                <h3 className="font-semibold">Item 5</h3>
                <p>Fifth stagger item</p>
              </div>
              <div className="stagger-item admin-card">
                <h3 className="font-semibold">Item 6</h3>
                <p>Sixth stagger item</p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Components Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Image Components</h2>
          </div>
          <div className="admin-section-content">
            <div className="admin-grid">
              <div className="image-hover">
                <div className="bg-gradient-to-br from-blue-400 to-purple-600 h-48 flex items-center justify-center text-white font-semibold">
                  Hover Image Effect
                </div>
              </div>
              <div className="image-container-responsive aspect-video">
                <div className="bg-gradient-to-br from-green-400 to-blue-600 h-full flex items-center justify-center text-white font-semibold">
                  Responsive Image Container
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Utility Classes Test */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Utility Classes</h2>
          </div>
          <div className="admin-section-content">
            <div className="space-y-4">
              <div className="touch-target bg-blue-100 dark:bg-blue-900 rounded">
                Touch Target (44px minimum)
              </div>
              <button className="focus-ring admin-btn admin-btn-primary">
                Focus Ring Test (Tab to see)
              </button>
              <div className="grid-responsive-cards">
                <div className="admin-card">Responsive Grid 1</div>
                <div className="admin-card">Responsive Grid 2</div>
                <div className="admin-card">Responsive Grid 3</div>
                <div className="admin-card">Responsive Grid 4</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}