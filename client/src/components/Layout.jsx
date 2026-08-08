import Navbar from './Navbar.jsx';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="container">{children}</main>
    </div>
  );
}
