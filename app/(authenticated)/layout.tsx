import Sidebar from '../components/Sidebar';
import PermisoRutaGuard from '../components/PermisoRutaGuard';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PermisoRutaGuard />
      <main className="flex-1 lg:ml-64 p-8 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
