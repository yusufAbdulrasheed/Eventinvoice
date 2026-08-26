export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-6 text-center font-body-md text-sm text-on-surface-variant">
      <p>Copyright &copy; {year} Generous Event. All rights reserved.</p>
      <p className="mt-1">Developed by Abdulrasheed Yusuf</p>
    </footer>
  );
}
