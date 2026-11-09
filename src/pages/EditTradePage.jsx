import { useParams } from "react-router-dom";
import { useTrades } from "../hooks/useTrades.js";
import TradeForm from "../components/trades/TradeForm.jsx";
import LoadingState from "../components/ui/LoadingState.jsx";

export default function EditTradePage() {
  const { id } = useParams();
  const { getTrade, loading } = useTrades();

  if (loading) return <LoadingState message="Loading trade..." />;

  const trade = getTrade(id);

  if (!trade) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-tj-primary font-semibold">Trade not found</h2>
        <p className="text-tj-secondary text-sm mt-1">The trade you're trying to edit doesn't exist.</p>
        <a
          href="/trades"
          className="inline-block mt-6 btn-outline px-6 py-2.5"
        >
          Back to Trade History
        </a>
      </div>
    );
  }

  return <TradeForm mode="edit" initialTrade={trade} />;
}
