<script setup lang="ts">
// Landing page logic would go here
</script>

<template>
  <div class="p-0">
    <!-- Hero Section -->
    <section class="landing-hero min-h-[80vh] flex items-center justify-center text-white px-16 py-16 relative overflow-hidden md:flex-row flex-col text-center md:text-left md:px-8 md:py-8">
      <div class="flex-1 max-w-[600px] z-10 relative">
        <h1 class="text-3xl md:text-4xl lg:text-6xl font-extrabold mb-4 leading-tight">
          AdaptiveAuth
        </h1>
        <p class="text-base md:text-lg lg:text-xl mb-8 opacity-90 leading-relaxed">
          Full-stack adaptive authentication: explicit refresh orchestration, session policy, and a Vue SPA you can extend
        </p>
        <div class="flex gap-4 flex-wrap md:justify-center">
          <button class="inline-flex items-center justify-center px-6 py-3 border-0 rounded-md font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
            Get Started
          </button>
          <button class="inline-flex items-center justify-center px-6 py-3 border-0 rounded-md font-medium text-emerald-600 bg-white hover:bg-gray-50 transition-all">
            Learn More
          </button>
        </div>
      </div>
      <div class="flex-1 flex items-center justify-center z-10 relative md:mt-8">
        <div class="layout-preview w-[300px] h-[200px] bg-white rounded-xl shadow-2xl overflow-hidden md:w-[250px] md:h-[160px]">
          <div class="h-10 bg-gray-100 border-b border-gray-200" />
          <div class="flex h-[calc(100%-40px)]">
            <div class="w-20 bg-emerald-600 opacity-80" />
            <div
              class="flex-1 bg-gradient-to-br from-gray-100 via-transparent to-gray-100"
              style="background-size: 20px 20px"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 px-8 bg-gray-50 md:py-16 md:px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-center text-2xl md:text-3xl lg:text-4xl font-extrabold mb-12 md:mb-16 text-gray-900">
          Why Choose AdaptiveAuth?
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div class="bg-white border border-gray-200 rounded-md p-8 shadow-sm text-center transition-transform hover:-translate-y-2 md:p-6">
            <div class="text-4xl mb-4">
              🎨
            </div>
            <h3 class="text-xl font-semibold mb-4 text-gray-900">
              Flexible Design
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Create any layout combination with our composable system
            </p>
          </div>

          <div class="bg-white border border-gray-200 rounded-md p-8 shadow-sm text-center transition-transform hover:-translate-y-2 md:p-6">
            <div class="text-4xl mb-4">
              ⚡
            </div>
            <h3 class="text-xl font-semibold mb-4 text-gray-900">
              High Performance
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Optimized for speed with lazy loading and code splitting
            </p>
          </div>

          <div class="bg-white border border-gray-200 rounded-md p-8 shadow-sm text-center transition-transform hover:-translate-y-2 md:p-6">
            <div class="text-4xl mb-4">
              🔧
            </div>
            <h3 class="text-xl font-semibold mb-4 text-gray-900">
              Easy Configuration
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Simple preset system with full customization options
            </p>
          </div>

          <div class="bg-white border border-gray-200 rounded-md p-8 shadow-sm text-center transition-transform hover:-translate-y-2 md:p-6">
            <div class="text-4xl mb-4">
              📱
            </div>
            <h3 class="text-xl font-semibold mb-4 text-gray-900">
              Responsive
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Mobile-first design that works on all screen sizes
            </p>
          </div>

          <div class="bg-white border border-gray-200 rounded-md p-8 shadow-sm text-center transition-transform hover:-translate-y-2 md:p-6">
            <div class="text-4xl mb-4">
              🛡️
            </div>
            <h3 class="text-xl font-semibold mb-4 text-gray-900">
              Type Safe
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Full TypeScript support for better developer experience
            </p>
          </div>

          <div class="bg-white border border-gray-200 rounded-md p-8 shadow-sm text-center transition-transform hover:-translate-y-2 md:p-6">
            <div class="text-4xl mb-4">
              🚀
            </div>
            <h3 class="text-xl font-semibold mb-4 text-gray-900">
              Production Ready
            </h3>
            <p class="text-gray-600 leading-relaxed">
              Battle-tested components ready for enterprise use
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Code Example Section -->
    <section class="py-24 px-8 bg-slate-800 text-white md:py-16 md:px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-center text-2xl md:text-3xl lg:text-4xl font-extrabold mb-12 md:mb-16 text-white">
          Simple to Use
        </h2>
        <div class="flex items-center justify-center">
          <div class="bg-slate-900 rounded-xl p-8 max-w-2xl w-full overflow-x-auto md:p-6">
            <pre class="m-0 font-mono text-sm leading-relaxed text-gray-100 md:text-xs"><code>// Parent owns layout; children fill the outlet
{
  path: '/',
  meta: { layout: 'app', requiresAuth: true },
  children: [{
    path: 'dashboard',
    meta: {
      showInNav: true,
      navGroup: 'app',
      title: 'Dashboard',
    },
  }]
}

// Product presets: auth | marketing | app | admin
{
  path: '/about',
  meta: { layout: 'marketing' }
}</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="landing-hero py-24 px-8 text-white text-center md:py-16 md:px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-extrabold mb-4">
          Ready to Get Started?
        </h2>
        <p class="text-base md:text-lg mb-8 opacity-90">
          Join thousands of developers building amazing applications
        </p>
        <button class="inline-flex items-center justify-center px-8 py-4 border-0 rounded-md font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-all text-lg">
          Start Building Today
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Landing styles are handled globally; component has no local styles */
</style>
