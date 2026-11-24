import Sidebar from './Sidebar';
export default function Layout({ children }) {
  return (<div className="flex h-screen overflow-hidden bg-gray-100"><Sidebar /><main className="flex-1 p-6 overflow-auto">{children}</main></div>);
}
