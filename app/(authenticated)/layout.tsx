import Sidebar from '../components/Sidebar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-8 bg-gray-100">
        {children}
      </main>
    </div>
  );
}