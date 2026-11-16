export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-700 p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Project Foundation
        </p>
        <h1 className="mt-4 text-4xl font-bold">QuangHuy_Sport</h1>
        <p className="mt-6 leading-relaxed text-slate-300">
          React, TypeScript và Tailwind CSS đã được khởi tạo. Các chức năng mua
          hàng và AI chưa được triển khai.
        </p>
        <a
          className="mt-8 inline-block rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
          href="/health"
        >
          Kiểm tra kết nối backend và PostgreSQL
        </a>
      </section>
    </main>
  )
}
