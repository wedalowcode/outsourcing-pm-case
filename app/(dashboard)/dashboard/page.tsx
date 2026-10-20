export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          工作台
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          欢迎使用项目管理平台。
        </p>
      </div>

      <section className="rounded-lg border bg-white p-6">
        <h2 className="font-medium">系统概览</h2>

        <p className="mt-2 text-sm text-slate-500">
          后续可以在这里展示项目数量、任务进度、
          待处理事项等业务数据。
        </p>
      </section>
    </div>
  );
}
