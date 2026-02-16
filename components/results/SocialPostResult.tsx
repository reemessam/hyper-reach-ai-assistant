import ResultCard from "@/components/ResultCard";

interface SocialPostResultProps {
  socialPost: string;
  onCopy: () => void;
  copied: boolean;
}

export default function SocialPostResult({
  socialPost,
  onCopy,
  copied,
}: SocialPostResultProps) {
  function shareToTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialPost)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareToFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(socialPost)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <ResultCard
      title="Social Media Post"
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Post"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={shareToTwitter}
            className="text-xs bg-gray-900 hover:bg-gray-800 text-white px-3 py-1 rounded-full font-medium transition-colors"
          >
            Share to X
          </button>
          <button
            type="button"
            onClick={shareToFacebook}
            className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded-full font-medium transition-colors"
          >
            Share to Facebook
          </button>
        </div>
      }
    >
      <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
        {socialPost}
      </div>
    </ResultCard>
  );
}
