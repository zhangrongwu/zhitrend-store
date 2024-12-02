import { useState } from 'react';

export default function Home() {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            欢迎来到我们的网站
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            这里是网站的简介文字，您可以在这里介绍您的网站主要功能和特点。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/products"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              浏览产品
            </a>
            <a href="/about" className="text-sm font-semibold leading-6 text-gray-900">
              了解更多 <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 