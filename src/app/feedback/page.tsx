"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Search, Loader2, Star, AlertTriangle, CheckCircle2, HeartHandshake, RefreshCw } from "lucide-react";

interface FeedbackItem {
  id: string;
  booking_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  vehicle_name: string | null;
  service_type: string | null;
  feedback_rating: number | null;
  feedback_text: string | null;
  escalation_required: boolean | null;
  status: string; // pending, ready_to_send, sent, failed
  created_at: string;
}

export default function FeedbackPage() {
  const supabase = createClient();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("feedback_queue")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error("Failed to load feedback", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Calculate stats
  const ratedItems = feedback.filter((f) => f.feedback_rating !== null);
  const totalReviews = ratedItems.length;

  const averageRating = totalReviews > 0
    ? Number((ratedItems.reduce((sum, f) => sum + f.feedback_rating!, 0) / totalReviews).toFixed(1))
    : 0;

  // NPS Score calculation
  // Promoters (9-10 rating, mapped here as 5 stars), Detractors (0-6 rating, mapped as <=3 stars)
  const promoters = ratedItems.filter((f) => f.feedback_rating === 5).length;
  const detractors = ratedItems.filter((f) => f.feedback_rating! <= 3).length;
  const npsScore = totalReviews > 0
    ? Math.round(((promoters - detractors) / totalReviews) * 100)
    : 0;

  // Rating distribution calculation
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratedItems.filter((f) => f.feedback_rating === stars).length;
    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, pct };
  });

  const filtered = feedback.filter((f) => {
    const nameMatch = (f.customer_name || "").toLowerCase().includes(search.toLowerCase());
    const textMatch = (f.feedback_text || "").toLowerCase().includes(search.toLowerCase());
    const matchesSearch = nameMatch || textMatch;

    const matchesRating = ratingFilter === "" 
      ? true 
      : f.feedback_rating === Number(ratingFilter);

    return matchesSearch && matchesRating;
  });

  return (
    <div className="crm-page">
      {/* Toolbar */}
      <div className="crm-toolbar">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h1 className="crm-toolbar-title">Customer Feedback Registry</h1>
          <span className="ml-2 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" />
            {averageRating} Average Rating ({totalReviews} reviews)
          </span>
        </div>
        <div className="crm-toolbar-actions">
          <button onClick={loadData} className="crm-btn-secondary crm-btn-sm">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="crm-filter-bar">
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crm-input pl-9 w-full outline-none"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="crm-select"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      <div className="crm-body">
        {/* Top summary grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="crm-stat-label">Total Reviews</span>
              <div className="crm-stat-value text-slate-800">{totalReviews}</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#FFFBEB" }}>
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <span className="crm-stat-label">Average Score</span>
              <div className="crm-stat-value text-amber-600">{averageRating} ★</div>
            </div>
          </div>

          <div className="crm-stat-card crm-hover-glow">
            <div className="crm-stat-icon" style={{ backgroundColor: "#ECFDF5" }}>
              <HeartHandshake className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <span className="crm-stat-label">NPS Score</span>
              <div className="crm-stat-value text-emerald-600">{npsScore}</div>
            </div>
          </div>

          {/* Rating distribution bar graph */}
          <div className="crm-card bg-white p-4 flex flex-col justify-center gap-1.5 text-[11px] text-slate-600">
            {distribution.map((d) => (
              <div key={d.stars} className="flex items-center gap-2">
                <span className="w-10 font-medium">{d.stars} ★</span>
                <div className="crm-progress-track flex-1 h-2">
                  <div
                    className="crm-progress-fill h-2"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-400 font-semibold">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
            <p className="text-slate-500 text-xs font-medium">Fetching customer feedback...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card max-w-xl mx-auto p-12 text-center mt-10">
            <div className="crm-empty">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-4 mx-auto" />
              <h4 className="crm-empty-title">No reviews found</h4>
              <p className="crm-empty-desc">
                {search || ratingFilter
                  ? "Try resetting your search query or filters."
                  : "No completed customer reviews logged in queue."}
              </p>
            </div>
          </div>
        ) : (
          <div className="crm-table-wrapper crm-hover-glow bg-white">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Info</th>
                  <th>Service Details</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Sentiment</th>
                  <th className="text-right">Escalation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const rating = item.feedback_rating;
                  let sentiment = "neutral";
                  let sentimentBadge = "crm-badge-neutral";
                  if (rating !== null) {
                    if (rating >= 4) {
                      sentiment = "positive";
                      sentimentBadge = "crm-badge-success";
                    } else if (rating <= 2) {
                      sentiment = "negative";
                      sentimentBadge = "crm-badge-danger";
                    } else {
                      sentiment = "neutral";
                      sentimentBadge = "crm-badge-warning";
                    }
                  }

                  return (
                    <tr key={item.id} className="crm-interactive">
                      <td className="font-semibold text-slate-900">
                        {item.customer_name || "—"}
                      </td>
                      <td>
                        <span className="text-slate-700 text-xs">{item.customer_phone || "—"}</span>
                      </td>
                      <td>
                        <div className="font-medium text-slate-800">{item.vehicle_name || "—"}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                          {item.service_type || "General Maintenance"}
                        </div>
                      </td>
                      <td>
                        {rating !== null ? (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < rating! 
                                    ? "text-amber-400 fill-amber-400" 
                                    : "text-slate-200 fill-slate-100"
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">No reply</span>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate text-slate-600" title={item.feedback_text || ""}>
                        {item.feedback_text ? `"${item.feedback_text}"` : "—"}
                      </td>
                      <td>
                        {rating !== null ? (
                          <span className={sentimentBadge}>
                            <span className={
                              sentiment === "positive" 
                                ? "crm-dot-success" 
                                : sentiment === "negative" 
                                  ? "crm-dot-danger" 
                                  : "crm-dot-warning"
                            } />
                            <span className="capitalize">{sentiment}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        {item.escalation_required ? (
                          <span className="crm-badge-danger animate-pulse font-bold">
                            <span className="crm-dot-danger" />
                            Escalated
                          </span>
                        ) : rating && rating >= 4 ? (
                          <span className="crm-badge-success">Nominal</span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
