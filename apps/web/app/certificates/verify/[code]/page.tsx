import { CheckCircle2, Award, GraduationCap, ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

async function getCertificate(code: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/certificates/verify/${code}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export default async function VerifyCertPage({ params }: { params: { code: string } }) {
  const cert = await getCertificate(params.code);

  const issuedDate = cert
    ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-brand-50 dark:from-brand-900 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-brand-600">LearnHub</span>
        </Link>

        {cert ? (
          <div className="card overflow-hidden">
            {/* Green header band */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800 px-6 py-5 flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-lg">Certificate Verified ✓</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">This is an authentic LearnHub certificate</p>
              </div>
            </div>

            {/* Certificate details */}
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Certificate awarded to</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">{cert.user?.name}</p>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800" />

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Course completed</p>
                <p className="font-medium text-gray-900 dark:text-white">{cert.course?.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Issue date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{issuedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Certificate ID</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{cert.verificationCode}</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Issued by LearnHub · Verified on {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Certificate not found</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              The verification code <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">{params.code}</code> does not match any certificate in our system.
            </p>
            <Link href="/" className="btn-secondary text-sm">Back to LearnHub</Link>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? <a href="mailto:support@learnhub.dev" className="text-brand-600 hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
}
