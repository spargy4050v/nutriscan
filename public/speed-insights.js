// Vercel Speed Insights Integration
// This file initializes Vercel Speed Insights for performance monitoring

(function() {
  // Initialize Speed Insights
  // The injectSpeedInsights function will add the tracking script to the page
  // This must run on the client side and should be called once
  
  if (typeof window !== 'undefined') {
    // Create the window.si function if it doesn't exist
    window.si = window.si || function() {
      (window.siq = window.siq || []).push(arguments);
    };

    // Load the Speed Insights script
    if (document.readyState === 'loading') {
      // Document is still loading, wait for it to be ready
      document.addEventListener('DOMContentLoaded', function() {
        injectSpeedInsightsScript();
      });
    } else {
      // Document is already loaded
      injectSpeedInsightsScript();
    }
  }

  function injectSpeedInsightsScript() {
    // Check if the script is already loaded to avoid duplicates
    if (document.querySelector('script[src="/_vercel/speed-insights/script.js"]')) {
      return;
    }

    // Create and inject the Speed Insights script
    const script = document.createElement('script');
    script.src = '/_vercel/speed-insights/script.js';
    script.defer = true;
    script.async = true;
    document.body.appendChild(script);
  }
})();
