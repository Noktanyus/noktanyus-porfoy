import BlogCard from "@/components/BlogCard";
import { Blog } from "@/types/content";

interface LatestBlogsProps {
  blogs: Blog[];
}

export default function LatestBlogs({ blogs }: LatestBlogsProps) {
  if (blogs.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 md:py-10">
      <div className="container-responsive">
        <div className="section-header fade-in">
          <h2 className="section-title">Son Blog Yazıları</h2>
          <p className="section-subtitle">
            Teknoloji, geliştirme süreçleri ve deneyimlerim hakkında yazdığım son yazılar.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {blogs.map((blog, index) => (
            <div key={blog.id}>
              <BlogCard blog={blog} />
            </div>
          ))}
        </div>
        
        {/* Tüm blog yazılarını görme linki */}
        <div className="text-center mt-8 fade-in" style={{animationDelay: '0.6s'}}>
          <a 
            href="/blog" 
            className="btn-animated inline-flex items-center group bg-brand-primary text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Tüm Blog Yazılarını Oku
            <svg className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}