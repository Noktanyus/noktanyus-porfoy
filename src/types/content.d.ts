// General Type for a Post (Blog or Project)
export interface Post {
    id: string;
    title: string;
    date: string;
    description: string;
    thumbnail?: string;
    [key: string]: any;
}

// Type for Blog Posts
export interface Blog extends Post {
    author: string;
    category: string;
    tags: string[];
}

// Type for Projects
export interface Project extends Post {
    slug: string;
    mainImage: string; // New field for the main project image
    technologies: string[];
    liveDemo?: string;
    githubRepo?: string;
    order: number;
    featured: boolean;
    isLive: boolean;
}

// Type for About page content
export interface Experience {
    title: string;
    company: string;
    date: string;
    description: string;
}

export interface AboutData {
    name: string;
    title: string;
    subTitle?: string; // Alt başlık eklendi
    headerTitle: string;
    shortDescription: string;
    profileImage: string;
    aboutImage?: string; // Hakkımda sayfası görseli eklendi
    social: {
        linkedin: string;
        github: string;
        twitter: string;
    };
    workingOn: string[];
    experiences: Experience[];
    content: string; // The markdown body content
}

// Type for Skills
export interface Skill {
    name: string;
}

// Type for Testimonials
export interface Testimonial {
    name: string;
    title: string;
    company: string;
    avatar: string;
    comment: string;
}

// Type for SEO Settings
export interface SeoSettings {
    siteTitle: string;
    siteDescription: string;
    siteKeywords: string[];
    canonicalUrl: string;
    robots: string;
    favicon: string;
    og: {
        title: string;
        description: string;
        image: string;
        type: string;
        url: string;
        site_name: string;
    };
    twitter: {
        card: string;
        site: string;
        creator: string;
        title: string;
        description: string;
        image: string;
    };
}

// Type for Popups
export interface PopupButton {
    text: string;
    actionType: 'redirect' | 'show-text' | 'run-code';
    actionValue: string;
}

export interface Popup {
    slug: string;
    title: string;
    content: string;
    imageUrl?: string;
    youtubeEmbedUrl?: string;
    buttons: PopupButton[];
    isActive: boolean;
}

// Type for Contact Messages
export interface Message {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    replies: any[]; // Define a reply type if needed
}



// Type for Home Page Settings
export interface HomeSettings {
    featuredContent: {
        type: 'video' | 'text' | 'customCode';
        youtubeUrl?: string;
        textTitle?: string;
        textContent?: string;
        customHtml?: string;
    };
}

// Type for Live Projects
export interface LiveProject {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnail: string;
    order: number;
    content?: string;
    contentHtml?: string;
}
