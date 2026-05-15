import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1a110d] py-10 text-[#fffaf0]">
      <div className="container-shell flex flex-col justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-3"><img src="/ravana-bhawana-logo.png" alt="" className="h-12 w-12 rounded-full" /><div><b>රාවණ භවණ</b><p className="text-sm text-[#e3c27f]">Free social service platform</p></div></div>
        <Link className="text-sm text-[#e3c27f]" to="/admin/login">Admin login</Link>
      </div>
    </footer>
  );
}
