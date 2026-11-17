import { Link } from 'react-router-dom';
import { ContactStrip } from '../components/Layout';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function NotFoundPage() {
  useDocumentMeta({
    title: 'Page Not Found – DGP LOGISTICS',
    description: 'The requested page could not be found on DGP LOGISTICS.',
    noindex: true,
  });

  return (
    <div>
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="font-mono-tabular text-sm font-bold text-[#082B59]">404</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082B59]">
            Page not found
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            The page you tried to open does not exist or may have moved. Use one of the links below
            to continue.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-[#082B59] text-white text-sm font-bold hover:bg-[#051d3d]"
            >
              Return home
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg border border-slate-300 text-[#082B59] text-sm font-bold hover:bg-[#F3F6FA]"
            >
              View services
            </Link>
            <Link
              to="/request-quote"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-[#FFD43B] text-[#082B59] text-sm font-extrabold hover:bg-[#f5c418]"
            >
              Request quote
            </Link>
          </div>
        </div>
      </section>
      <ContactStrip />
    </div>
  );
}
