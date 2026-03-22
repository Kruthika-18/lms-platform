'use client';
import Link from 'next/link';
import { Award, Download, ExternalLink, Share2, CheckCircle2 } from 'lucide-react';
import { useCertificates } from '../../../hooks/use-api';
import { useAuthStore } from '../../../lib/auth-store';

function CertCard({ cert }: { cert: any }) {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const linkedInUrl = cert.course
    ? `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.course.title)}&organizationName=LearnHub&issueYear=${new Date(cert.issuedAt).getFullYear()}&issueMonth=${new Date(cert.issuedAt).getMonth() + 1}&certUrl=${encodeURIComponent(cert.pdfUrl ?? '')}&certId=${cert.verificationCode}`
    : '#';

  return (
    <div className="card p-6 relative overflow-hidden group">
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-100 to-transparent dark:from-brand-800/30 rounded-bl-[60px]" />
      <div className="absolute top-3 right-3 w-8 h-8 bg-brand-50 dark:bg-brand-900/50 rounded-full flex items-center justify-center">
        <Award className="w-4 h-4 text-brand-600 dark:text-brand-400" />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white leading-snug pr-8">
          {cert.course?.title ?? 'Course Certificate'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Issued {issuedDate}</p>
      </div>

      <div className="text-xs text-gray-400 font-mono mb-5 truncate">
        ID: {cert.verificationCode}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {cert.pdfUrl && (
          <a href={cert.pdfUrl} download target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors">
            <Download className="w-3.5 h-3.5" /> Download PDF
          </a>
        )}
        <a href={linkedInUrl} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
          <Share2 className="w-3.5 h-3.5" /> Add to LinkedIn
        </a>
        <Link href={`/certificates/verify/${cert.verificationCode}`}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" /> Verify
        </Link>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const { data: certs, isLoading } = useCertificates();
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-1">My Certificates</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {certs?.length ?? 0} certificate{(certs?.length ?? 0) !== 1 ? 's' : ''} earned
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="card p-6 space-y-3 animate-pulse">
              <div className="skeleton h-4 w-1/4 rounded" />
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/3 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="flex gap-2 mt-4">
                <div className="skeleton h-7 w-28 rounded-lg" />
                <div className="skeleton h-7 w-32 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : !certs?.length ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No certificates yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Complete a course to earn your first verified certificate.
          </p>
          <Link href="/courses" className="btn-primary text-sm">Find a course</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {certs.map((cert: any) => <CertCard key={cert.id} cert={cert} />)}
        </div>
      )}
    </div>
  );
}
