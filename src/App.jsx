import React, { useState, useEffect } from 'react';
import { 
  Search, Play, Star, TrendingUp, Clock, Home, Film, 
  AlertCircle, ArrowLeft, Eye, Tv, ChevronRight, Sparkles,
  X
} from 'lucide-react';

const API_BASE = 'https://restxdb.onrender.com/api';
const LANG = 'in';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [popularDramas, setPopularDramas] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrama, setSelectedDrama] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (activeTab === 'home') {
      loadHomeData();
    } else if (activeTab === 'popular') {
      setLoading(true);
      fetchPopular().then(() => setLoading(false));
    } else if (activeTab === 'new') {
      setLoading(true);
      fetchNewReleases().then(() => setLoading(false));
    }
  }, [activeTab]);

  const loadHomeData = async () => {
    setLoading(true);
    await Promise.all([
      fetchRecommendations(),
      fetchNewReleases(),
      fetchPopular()
    ]);
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${API_BASE}/foryou/1?lang=${LANG}`);
      const data = await res.json();
      const items = data?.data?.list || [];
      setRecommendations(items);
    } catch (e) {
      console.error('Recommendations error:', e);
    }
  };

  const fetchNewReleases = async () => {
    try {
      const res = await fetch(`${API_BASE}/new/1?lang=${LANG}&pageSize=10`);
      const data = await res.json();
      const items = data?.data?.list || [];
      setNewReleases(items);
    } catch (e) {
      console.error('New releases error:', e);
    }
  };

  const fetchPopular = async () => {
    try {
      const res = await fetch(`${API_BASE}/rank/1?lang=${LANG}`);
      const data = await res.json();
      const items = data?.data?.list || [];
      setPopularDramas(items);
    } catch (e) {
      console.error('Popular error:', e);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    try {
      const res = await fetch(`${API_BASE}/search/${encodeURIComponent(query)}/1?lang=${LANG}`);
      const data = await res.json();
      const items = data?.data?.list || [];
      setSearchResults(items);
      setPreviousTab(activeTab);
      setActiveTab('search');
      if (items.length === 0) {
        setError('Tidak ada hasil ditemukan');
      }
    } catch (e) {
      setError('Gagal melakukan pencarian');
    }
    setLoading(false);
  };

  const handleSearchInput = async (val) => {
    setSearchQuery(val);
    if (val.length > 1) {
      try {
        const res = await fetch(`${API_BASE}/suggest/${encodeURIComponent(val)}?lang=${LANG}`);
        const data = await res.json();
        setSuggestions(data?.data || []);
        setShowSuggestions(true);
      } catch (e) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const getDramaTitle = (drama) => drama?.bookName || drama?.name || drama?.title || 'Tanpa Judul';
  const getDramaDesc = (drama) => drama?.introduction || drama?.description || drama?.intro || '';
  const getDramaCover = (drama) => drama?.cover || drama?.coverWap || drama?.coverUrl || '';
  const getDramaId = (drama) => drama?.bookId || drama?.id || drama?.dramaId || '';
  const getDramaTags = (drama) => drama?.tags || drama?.tagV3s?.map(t => t.tagName) || [];

  const selectDrama = async (drama) => {
    setPreviousTab(activeTab);
    setSelectedDrama(drama);
    setActiveTab('detail');
    setLoading(true);
    setError('');
    setShowVideo(false);
    setVideoUrl('');
    setCurrentEpisodeIndex(0);

    const bookId = getDramaId(drama);

    try {
      const res = await fetch(`${API_BASE}/chapters/${bookId}?lang=${LANG}`);
      const data = await res.json();
      const episodeList = data?.data?.chapterList || [];
      setEpisodes(episodeList);
      if (episodeList.length === 0) {
        setError('Tidak ada episode tersedia untuk drama ini');
      }
    } catch (e) {
      setError('Gagal memuat episode');
      setEpisodes([]);
    }
    setLoading(false);
  };

  const goBack = () => {
    setSelectedDrama(null);
    setShowVideo(false);
    setVideoUrl('');
    setActiveTab(previousTab);
  };

  const playEpisode = async (episode, index) => {
    setLoading(true);
    setError('');
    setCurrentEpisodeIndex(index);

    const bookId = getDramaId(selectedDrama);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch(`${API_BASE}/watch/${bookId}/${index}?lang=${LANG}&source=search_result`);
      const data = await res.json();
      const url = data?.data?.videoUrl || data?.data?.url;

      if (url) {
        setVideoUrl(url);
        setShowVideo(true);
      } else {
        setError('Video tidak tersedia saat ini. Silakan coba episode lain.');
      }
    } catch (e) {
      setError('Gagal memutar video. Silakan coba lagi.');
    }
    setLoading(false);
  };

  const handlePlayNow = () => {
    if (episodes.length > 0) {
      playEpisode(episodes[0], 0);
    }
  };

  const playNextEpisode = () => {
    const nextIndex = currentEpisodeIndex + 1;
    if (nextIndex < episodes.length) {
      playEpisode(episodes[nextIndex], nextIndex);
    }
  };

  const handleVideoEnd = () => playNextEpisode();

  // Drama Card Component
  const DramaCard = ({ drama, index, showRank = false }) => (
    <div onClick={() => selectDrama(drama)} className="drama-card group">
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {getDramaCover(drama) ? (
          <img
            src={getDramaCover(drama)}
            alt={getDramaTitle(drama)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
            <Film className="w-12 h-12 text-gray-500" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:animate-pulse-glow">
            <Play className="w-6 h-6 md:w-7 md:h-7 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* Score Badge */}
        {drama?.score && (
          <div className="absolute top-2 right-2 score-badge">
            <Star className="w-3 h-3" fill="white" />
            <span>{drama.score}</span>
          </div>
        )}

        {/* Rank Badge */}
        {showRank && index !== undefined && index < 3 && (
          <div className={`absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg ${
            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/30' :
            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-gray-400/30' :
            'bg-gradient-to-br from-amber-600 to-amber-800 shadow-amber-600/30'
          }`}>
            {index + 1}
          </div>
        )}

        {/* Episode Count Badge */}
        {drama?.chapterCount && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white">
            <Tv className="w-3 h-3" />
            <span>{drama.chapterCount} EP</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 md:p-4">
        <h3 className="font-semibold text-sm md:text-base text-white line-clamp-2 min-h-[2.5rem] mb-2 group-hover:text-purple-400 transition-colors">
          {getDramaTitle(drama)}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          {drama?.playCount && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {drama.playCount}
            </span>
          )}
        </div>

        {getDramaTags(drama).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {getDramaTags(drama).slice(0, 2).map((tag, i) => (
              <span key={i} className="tag-pill text-[10px] md:text-xs px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Search Result Card
  const SearchResultCard = ({ drama }) => (
    <div
      onClick={() => selectDrama(drama)}
      className="glass-card rounded-2xl overflow-hidden flex gap-4 p-4 cursor-pointer 
                 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/10
                 hover:border-purple-500/30"
    >
      <div className="w-24 sm:w-32 flex-shrink-0">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-gray-800">
          {getDramaCover(drama) ? (
            <img
              src={getDramaCover(drama)}
              alt={getDramaTitle(drama)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
              <Film className="w-8 h-8 text-gray-500" />
            </div>
          )}
          {drama?.score && (
            <div className="absolute top-1.5 right-1.5 score-badge text-[10px]">
              <Star className="w-2.5 h-2.5" fill="white" />
              {drama.score}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-bold text-base md:text-lg text-white line-clamp-2 mb-2 hover:text-purple-400 transition-colors">
          {getDramaTitle(drama)}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
          {getDramaDesc(drama)}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
          {drama?.chapterCount && (
            <span className="flex items-center gap-1.5">
              <Tv className="w-4 h-4" />
              {drama.chapterCount} Episode
            </span>
          )}
          {drama?.playCount && (
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {drama.playCount}
            </span>
          )}
        </div>

        {getDramaTags(drama).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {getDramaTags(drama).slice(0, 3).map((tag, i) => (
              <span key={i} className="tag-pill">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center">
        <ChevronRight className="w-6 h-6 text-gray-500" />
      </div>
    </div>
  );

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-gray-800/50 border border-white/5">
          <div className="aspect-[2/3] shimmer" />
          <div className="p-4 space-y-3">
            <div className="h-4 shimmer rounded-lg" />
            <div className="h-3 shimmer rounded-lg w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  // Section Header
  const SectionHeader = ({ icon: Icon, title, iconBg = "from-purple-500 to-indigo-500" }) => (
    <div className="section-header">
      <div className={`section-icon bg-gradient-to-br ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between gap-4 mb-3 md:mb-4">
            {/* Logo */}
            <div
              onClick={() => {
                setActiveTab('home');
                setPreviousTab('home');
                setSelectedDrama(null);
                setShowVideo(false);
              }}
              className="flex items-center gap-2 md:gap-3 cursor-pointer group"
            >
              <div className="p-2 md:p-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 
                            group-hover:from-purple-500 group-hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20">
                <Film className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-lg md:text-2xl font-extrabold gradient-text hidden sm:block">
                DSeriesHub
              </h1>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Cari drama favorit..."
                className="search-input text-sm md:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full glass rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up">
                  {searchSuggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSearchQuery(s);
                        handleSearch(s);
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-3 hover:bg-white/10 cursor-pointer text-white text-sm flex items-center gap-3 transition-colors"
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1 md:gap-2 overflow-x-auto hide-scrollbar pb-1">
            {[
              { id: 'home', label: 'Beranda', icon: Home },
              { id: 'popular', label: 'Populer', icon: TrendingUp },
              { id: 'new', label: 'Terbaru', icon: Clock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPreviousTab(tab.id);
                  setSelectedDrama(null);
                  setShowVideo(false);
                }}
                className={`nav-tab flex items-center gap-2 text-sm md:text-base whitespace-nowrap ${
                  activeTab === tab.id ? 'active' : ''
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 md:py-8 w-full">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 glass-card rounded-2xl border-red-500/30 flex items-center gap-3 animate-slide-up">
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && !selectedDrama && <LoadingSkeleton />}

        {/* Home Tab */}
        {activeTab === 'home' && !loading && !selectedDrama && (
          <div className="space-y-10 md:space-y-12 animate-fade-in">
            {recommendations.length > 0 && (
              <section>
                <SectionHeader icon={Sparkles} title="Rekomendasi untuk Anda" iconBg="from-purple-500 to-pink-500" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {recommendations.slice(0, 12).map((drama, i) => (
                    <DramaCard key={i} drama={drama} />
                  ))}
                </div>
              </section>
            )}

            {newReleases.length > 0 && (
              <section>
                <SectionHeader icon={Clock} title="Rilis Terbaru" iconBg="from-cyan-500 to-blue-500" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {newReleases.slice(0, 12).map((drama, i) => (
                    <DramaCard key={i} drama={drama} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Popular Tab */}
        {activeTab === 'popular' && !loading && !selectedDrama && popularDramas.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader icon={TrendingUp} title="Drama Populer" iconBg="from-orange-500 to-red-500" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {popularDramas.map((drama, i) => (
                <DramaCard key={i} drama={drama} index={i} showRank={true} />
              ))}
            </div>
          </section>
        )}

        {/* New Tab */}
        {activeTab === 'new' && !loading && !selectedDrama && newReleases.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader icon={Clock} title="Drama Terbaru" iconBg="from-green-500 to-emerald-500" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {newReleases.map((drama, i) => (
                <DramaCard key={i} drama={drama} />
              ))}
            </div>
          </section>
        )}

        {/* Search Results */}
        {activeTab === 'search' && !loading && !selectedDrama && (
          <section className="animate-fade-in">
            <SectionHeader icon={Search} title={`Hasil: "${searchQuery}"`} iconBg="from-violet-500 to-purple-500" />
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((drama, i) => (
                  <SearchResultCard key={i} drama={drama} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-block p-6 rounded-2xl glass mb-4">
                  <Search className="w-12 h-12 text-gray-500" />
                </div>
                <p className="text-gray-400 text-lg">Tidak ada hasil ditemukan</p>
              </div>
            )}
          </section>
        )}

        {/* Detail Page */}
        {activeTab === 'detail' && selectedDrama && (
          <div className="space-y-6 animate-fade-in">
            {/* Back Button */}
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="group-hover:underline">Kembali</span>
            </button>

            {/* Drama Info - Hidden when video playing */}
            {!showVideo && (
              <div className="glass-card rounded-3xl overflow-hidden">
                {/* Hero Banner */}
                <div className="relative h-48 sm:h-56 md:h-72 overflow-hidden">
                  <img
                    src={getDramaCover(selectedDrama)}
                    alt={getDramaTitle(selectedDrama)}
                    className="w-full h-full object-cover object-top blur-sm scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/80 to-transparent" />
                </div>

                <div className="relative px-4 sm:px-6 pb-6 -mt-28 sm:-mt-32 md:-mt-40">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Cover */}
                    <div className="w-28 sm:w-36 md:w-44 flex-shrink-0 mx-auto sm:mx-0">
                      <img
                        src={getDramaCover(selectedDrama)}
                        alt={getDramaTitle(selectedDrama)}
                        className="w-full rounded-2xl shadow-2xl border-4 border-gray-800/50 aspect-[2/3] object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left pt-0 sm:pt-12 md:pt-16">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 text-shadow">
                        {getDramaTitle(selectedDrama)}
                      </h1>

                      <p className="text-gray-300 text-sm md:text-base mb-4 line-clamp-3">
                        {getDramaDesc(selectedDrama) || 'Tidak ada deskripsi tersedia'}
                      </p>

                      {/* Tags */}
                      {getDramaTags(selectedDrama).length > 0 && (
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-5">
                          {getDramaTags(selectedDrama).map((tag, i) => (
                            <span key={i} className="tag-pill">{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Play Button */}
                      <button
                        onClick={handlePlayNow}
                        disabled={episodes.length === 0 || loading}
                        className="btn-primary w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" fill="white" />
                        <span>PLAY NOW</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video Player */}
            {showVideo && videoUrl && (
              <div className="space-y-4">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  {getDramaTitle(selectedDrama)} - Episode {currentEpisodeIndex + 1}
                </h2>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Video */}
                  <div className="flex-shrink-0 lg:w-auto">
                    <div className="video-container max-w-md mx-auto lg:mx-0">
                      <video
                        key={videoUrl}
                        src={videoUrl}
                        controls
                        autoPlay
                        onEnded={handleVideoEnd}
                        className="w-full aspect-[9/16]"
                        onError={() => setError('Gagal memutar video. Silakan coba episode lain.')}
                      />
                    </div>
                  </div>

                  {/* Episodes Grid */}
                  {!loading && episodes.length > 0 && (
                    <div className="flex-1 glass-card rounded-2xl p-4 lg:max-h-[700px] overflow-y-auto">
                      <h3 className="text-base md:text-lg font-bold text-white mb-4 sticky top-0 pb-2 flex items-center gap-2">
                        <Tv className="w-5 h-5 text-purple-400" />
                        Episode ({episodes.length})
                      </h3>
                      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
                        {episodes.map((ep, i) => (
                          <button
                            key={i}
                            onClick={() => playEpisode(ep, ep.chapterIndex)}
                            className={`episode-btn ${
                              currentEpisodeIndex === ep.chapterIndex
                                ? 'episode-btn-active'
                                : 'episode-btn-default'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Episodes Grid - When NOT playing */}
            {!showVideo && !loading && episodes.length > 0 && (
              <div className="glass-card rounded-2xl p-4 md:p-6">
                <h3 className="text-base md:text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-purple-400" />
                  Daftar Episode ({episodes.length})
                </h3>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                  {episodes.map((ep, i) => (
                    <button
                      key={i}
                      onClick={() => playEpisode(ep, ep.chapterIndex)}
                      className={`episode-btn ${
                        currentEpisodeIndex === ep.chapterIndex
                          ? 'episode-btn-active'
                          : 'episode-btn-default'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-10">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass border-t border-white/10 py-6 md:py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold gradient-text">DSeriesHub</span>
            </div>
            <p className="text-gray-400 text-sm text-center">
              © 2025 DSeriesHub. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;