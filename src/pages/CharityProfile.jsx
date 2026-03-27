import { useState, useEffect } from "react";
import { base44 } from "@/api/supabaseClient";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowLeft, ExternalLink, Calendar, DollarSign, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CharityProfile() {
  const [charity, setCharity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [donationAmount, setDonationAmount] = useState(50);
  const [showDonationSuccess, setShowDonationSuccess] = useState(false);

  const charityId = window.location.pathname.split("/charities/")[1]?.split("?")[0];

  useEffect(() => {
    if (!charityId) return;
    base44.entities.Charity.filter({ id: charityId })
      .then(data => { if (data.length) setCharity(data[0]); })
      .finally(() => setLoading(false));
  }, [charityId]);

  const handleDonate = async () => {
    setDonating(true);
    // Mock donation delay
    await new Promise(r => setTimeout(r, 1500));
    
    // Update charity total raised
    await base44.entities.Charity.update(charity.id, {
      total_raised: (charity.total_raised || 0) + donationAmount
    });
    
    setDonating(false);
    setShowDonationSuccess(true);
    setCharity({ ...charity, total_raised: (charity.total_raised || 0) + donationAmount });
  };

  if (loading) {
    return (
      <div className="pt-24 flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="pt-24 text-center py-20">
        <p className="text-muted-foreground">Charity not found.</p>
        <Link to="/charities"><Button variant="outline" className="mt-4">Back to Charities</Button></Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/charities" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Charities
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero Image */}
          <div className="aspect-video bg-muted rounded-2xl overflow-hidden mb-8">
            {charity.image_url ? (
              <img src={charity.image_url} alt={charity.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5">
                <Heart className="w-16 h-16 text-primary/20" />
              </div>
            )}
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                {charity.category}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold">{charity.name}</h1>
            </div>
            <div className="flex gap-3">
              <Link to="/subscribe">
                <Button className="rounded-full px-6 gap-2">
                  <Heart className="w-4 h-4" /> Support With Subscription
                </Button>
              </Link>
              {charity.website && (
                <a href={charity.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-full" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-card border border-border/50 rounded-xl p-5">
                  <DollarSign className="w-5 h-5 text-primary mb-2" />
                  <div className="font-serif text-2xl font-bold">${(charity.total_raised || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Raised</div>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-5">
                  <Heart className="w-5 h-5 text-primary mb-2" />
                  <div className="font-serif text-2xl font-bold">{charity.category}</div>
                  <div className="text-sm text-muted-foreground">Category</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 mb-8">
                <h2 className="font-semibold text-lg mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{charity.description}</p>
              </div>

              {/* Events */}
              {charity.events && charity.events.length > 0 && (
                <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
                  <h2 className="font-semibold text-lg mb-4">Upcoming Events</h2>
                  <div className="space-y-4">
                    {charity.events.map((event, i) => (
                      <div key={i} className="flex gap-4 items-start p-4 bg-muted/50 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{event.title}</div>
                          {event.date && <div className="text-sm text-muted-foreground">{event.date}</div>}
                          {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Donation Sidebar */}
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 sticky top-24">
                <h3 className="font-serif text-xl font-bold mb-2">One-off Donation</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Support {charity.name} immediately with a direct contribution.
                </p>

                {showDonationSuccess ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-green-800">Thank you!</div>
                    <p className="text-xs text-green-700 mt-1">Your donation of ${donationAmount} has been processed.</p>
                    <Button variant="outline" className="mt-4 w-full" onClick={() => setShowDonationSuccess(false)}>Donate Again</Button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 100].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setDonationAmount(amt)}
                          className={`py-2 rounded-lg text-sm font-medium transition-all ${
                            donationAmount === amt ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border hover:border-primary/50"
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(Number(e.target.value))}
                        className="w-full bg-white border border-border rounded-lg pl-9 pr-3 py-2 text-sm"
                        placeholder="Custom amount"
                      />
                    </div>
                    <Button onClick={handleDonate} disabled={donating} className="w-full rounded-xl py-6 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                      {donating ? "Processing..." : `Donate $${donationAmount}`}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                      100% of your donation goes directly to the charity.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}