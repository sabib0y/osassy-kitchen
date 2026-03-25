// Navigation Configuration for Subscription Service
// This replaces the old headerData.js with a more comprehensive structure

export interface NavItem {
  id: string;
  name: string;
  href: string;
  type: 'link' | 'dropdown' | 'button';
  requiresAuth?: boolean;
  requiresRole?: 'USER' | 'ADMIN';
  children?: NavItem[];
  icon?: string;
}

export interface NavigationConfig {
  public: NavItem[];
  authenticated: NavItem[];
  admin: NavItem[];
}

export const navigationConfig: NavigationConfig = {
  // Navigation for non-authenticated users
  public: [
    {
      id: 'home',
      name: 'Home',
      href: '/',
      type: 'link'
    },
    {
      id: 'meals',
      name: 'Meals',
      href: '/meals',
      type: 'link'
    },
    {
      id: 'our-process',
      name: 'Our Process',
      href: '/our-process',
      type: 'link'
    },
    {
      id: 'catering',
      name: 'Catering',
      href: '/catering',
      type: 'link'
    },
    {
      id: 'contact',
      name: 'Contact',
      href: '/contact',
      type: 'link'
    },
    {
      id: 'auth',
      name: 'Login / Sign Up',
      href: '/login',
      type: 'button'
    }
  ],

  // Navigation for authenticated regular users
  authenticated: [
    {
      id: 'home',
      name: 'Home',
      href: '/',
      type: 'link'
    },
    {
      id: 'meals',
      name: 'Meals',
      href: '/meals',
      type: 'link'
    },
    {
      id: 'our-process',
      name: 'Our Process',
      href: '/our-process',
      type: 'link'
    },
    {
      id: 'catering',
      name: 'Catering',
      href: '/catering',
      type: 'link'
    },
    {
      id: 'contact',
      name: 'Contact',
      href: '/contact',
      type: 'link'
    },
    {
      id: 'my-account',
      name: 'My Account',
      href: '#',
      type: 'dropdown',
      icon: 'fa-user-circle',
      children: [
        {
          id: 'dashboard',
          name: 'Dashboard',
          href: '/user/dashboard',
          type: 'link',
          icon: 'fa-tachometer-alt'
        },
        {
          id: 'my-subscriptions',
          name: 'My Subscriptions',
          href: '/user/subscriptions',
          type: 'link',
          icon: 'fa-sync-alt'
        },
        {
          id: 'orders',
          name: 'Order History',
          href: '/user/orders',
          type: 'link',
          icon: 'fa-shopping-bag'
        },
        {
          id: 'payments',
          name: 'Payment Methods',
          href: '/user/payments',
          type: 'link',
          icon: 'fa-credit-card'
        },
        {
          id: 'profile',
          name: 'Profile',
          href: '/user/profile',
          type: 'link',
          icon: 'fa-user'
        },
        {
          id: 'divider',
          name: '',
          href: '',
          type: 'link'
        },
        {
          id: 'logout',
          name: 'Logout',
          href: '/api/auth/signout',
          type: 'link',
          icon: 'fa-sign-out-alt'
        }
      ]
    }
  ],

  // Navigation for admin users
  admin: [
    {
      id: 'home',
      name: 'Home',
      href: '/',
      type: 'link'
    },
    {
      id: 'admin',
      name: 'Admin',
      href: '#',
      type: 'dropdown',
      icon: 'fa-cog',
      requiresRole: 'ADMIN',
      children: [
        {
          id: 'admin-dashboard',
          name: 'Dashboard',
          href: '/admin/dashboard',
          type: 'link',
          icon: 'fa-chart-line'
        },
        {
          id: 'menu-management',
          name: 'Menu Management',
          href: '/admin/menu',
          type: 'link',
          icon: 'fa-utensils'
        },
        {
          id: 'order-management',
          name: 'Order Management',
          href: '/admin/orders',
          type: 'link',
          icon: 'fa-list-alt'
        }
      ]
    },
    {
      id: 'meals',
      name: 'Meals',
      href: '/meals',
      type: 'link'
    },
    {
      id: 'our-process',
      name: 'Our Process',
      href: '/our-process',
      type: 'link'
    },
    {
      id: 'catering',
      name: 'Catering',
      href: '/catering',
      type: 'link'
    },
    {
      id: 'contact',
      name: 'Contact',
      href: '/contact',
      type: 'link'
    },
    {
      id: 'my-account',
      name: 'Account',
      href: '#',
      type: 'dropdown',
      icon: 'fa-user-circle',
      children: [
        {
          id: 'profile',
          name: 'Profile',
          href: '/user/profile',
          type: 'link',
          icon: 'fa-user'
        },
        {
          id: 'divider',
          name: '',
          href: '',
          type: 'link'
        },
        {
          id: 'logout',
          name: 'Logout',
          href: '/api/auth/signout',
          type: 'link',
          icon: 'fa-sign-out-alt'
        }
      ]
    }
  ]
};

// Helper function to get navigation based on user state
export const getNavigationItems = (isAuthenticated: boolean, userRole?: string): NavItem[] => {
  if (!isAuthenticated) {
    return navigationConfig.public;
  }
  
  if (userRole === 'ADMIN') {
    return navigationConfig.admin;
  }
  
  return navigationConfig.authenticated;
};

// Export additional UI helpers
export const navigationHelpers = {
  // Check if current path matches nav item
  isActive: (currentPath: string, navHref: string): boolean => {
    if (navHref === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(navHref);
  },
  
  // Get user display info
  getUserDisplay: (session: any) => {
    if (!session?.user) return null;
    return {
      name: session.user.name || 'User',
      email: session.user.email,
      avatar: session.user.image || null,
      role: session.user.role || 'USER'
    };
  },
  
  // Format subscription status for header badge
  getSubscriptionBadge: (activeSubscriptions: number): string | null => {
    if (activeSubscriptions === 0) return null;
    if (activeSubscriptions === 1) return '1 Active';
    return `${activeSubscriptions} Active`;
  }
};