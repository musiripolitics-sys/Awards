import AdminDashboard from "./AdminDashboard";

export const metadata = {
  title: "IGNUS Admin Console · District Awards",
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#050609]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 pb-24">
        <AdminDashboard />
      </div>
    </div>
  );
}
