import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, CheckCircle, Bell, Sparkles, Loader2, AlertCircle, Clock } from "lucide-react";
import { format, isBefore, differenceInDays, addDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const categoryColors = {
  utilities: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  rent: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400",
  insurance: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
  credit_card: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400",
  loan: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400",
  tax: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-400",
  medical: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

export default function BillList({ bills, onEdit, onDelete, onMarkPaid, isLoading, hidePaidBills }) {
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [selectedBill, setSelectedBill] = React.useState(null);
  const [aiResponse, setAiResponse] = React.useState("");
  const [isAsking, setIsAsking] = React.useState(false);

  const handleAskAI = async (bill) => {
    setSelectedBill(bill);
    setAiDialogOpen(true);
    setIsAsking(true);
    setAiResponse("");

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a personal finance advisor helping someone manage their bills and budget. Focus on practical debt paydown strategies and budget optimization.

Bill Details:
- Name: ${bill.name}
- Amount: $${bill.amount}
- Due Date: ${format(new Date(bill.due_date), 'PPP')}
- Category: ${bill.category}
- Recurring: ${bill.recurring ? 'Yes' : 'No'}
- Status: ${bill.status}

Provide actionable financial advice on:
1. **Payment Strategy**: Best timing and method to pay this bill to avoid fees and optimize cash flow
2. **Cost Reduction**: Specific ways to negotiate, reduce, or eliminate this expense
3. **Debt Paydown**: If this is debt, recommend paydown strategies (snowball vs avalanche method)
4. **Budget Integration**: How to fit this into a monthly budget effectively
5. **Automation**: How to set up automatic payments to never miss due dates

Be specific, practical, and focused on helping them save money and reduce financial stress.`,
      });

      setAiResponse(response);
    } catch (error) {
      console.error('AI assistance error:', error);
      setAiResponse("I'm having trouble connecting right now. Please try again later.");
    } finally {
      setIsAsking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {hidePaidBills ? 'No unpaid bills found' : 'No bills found'}
        </p>
      </div>
    );
  }

  // Group bills by status
  const today = new Date();
  const overdueBills = bills.filter(b => b.status === 'pending' && isBefore(new Date(b.due_date), today));
  const dueSoonBills = bills.filter(b => {
    if (b.status !== 'pending') return false;
    const daysUntil = differenceInDays(new Date(b.due_date), today);
    return daysUntil >= 0 && daysUntil <= (b.notify_days_before || 3);
  });
  const upcomingBills = bills.filter(b => {
    if (b.status !== 'pending') return false;
    const daysUntil = differenceInDays(new Date(b.due_date), today);
    return daysUntil > (b.notify_days_before || 3);
  });
  const paidBills = bills.filter(b => b.status === 'paid');

  const BillCard = ({ bill }) => {
    const dueDate = new Date(bill.due_date);
    const daysUntil = differenceInDays(dueDate, today);
    const isOverdue = bill.status === 'pending' && isBefore(dueDate, today);
    const isDueSoon = daysUntil >= 0 && daysUntil <= (bill.notify_days_before || 3);
    const isPaid = bill.status === 'paid';

    return (
      <div
        className={`p-4 rounded-lg border transition-all ${
          isPaid
            ? 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-60'
            : isOverdue
            ? 'bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700 shadow-sm'
            : isDueSoon
            ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-400 dark:border-yellow-700 shadow-sm'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isPaid && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />}
              {isOverdue && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 animate-pulse" />}
              {isDueSoon && !isOverdue && <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />}
              
              <h3 className={`font-semibold text-gray-900 dark:text-gray-100 truncate ${isPaid ? 'line-through opacity-50' : ''}`}>
                {bill.name}
              </h3>
              
              <Badge variant="outline" className={categoryColors[bill.category]}>
                {bill.category}
              </Badge>
              
              {bill.recurring && (
                <Badge variant="outline" className="text-xs">
                  Recurring
                </Badge>
              )}
              
              {isPaid && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                  ✓ Paid
                </Badge>
              )}
              
              {isOverdue && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 animate-pulse">
                  ⚠ Overdue
                </Badge>
              )}
              
              {isDueSoon && !isOverdue && (
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
                  ⏰ Due Soon
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
              <span className={`font-semibold text-lg ${isPaid ? 'line-through opacity-50' : 'text-teal-600 dark:text-teal-400'}`}>
                ${bill.amount.toFixed(2)}
              </span>
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className={`
                  ${isPaid ? 'line-through opacity-50' : ''}
                  ${isOverdue ? 'font-bold text-red-700 dark:text-red-400' : ''}
                  ${isDueSoon && !isOverdue ? 'font-bold text-yellow-700 dark:text-yellow-400' : ''}
                `}>
                  Due {format(dueDate, 'MMM d, yyyy')}
                </span>
                {bill.status === 'pending' && (
                  <span className={`
                    ${isOverdue ? 'text-red-700 dark:text-red-400 font-bold' : ''}
                    ${isDueSoon && !isOverdue ? 'text-yellow-700 dark:text-yellow-400 font-bold' : ''}
                  `}>
                    {isOverdue ? `(${Math.abs(daysUntil)}d overdue!)` : `(${daysUntil}d)`}
                  </span>
                )}
              </div>

              {bill.notify_days_before && bill.status === 'pending' && (
                <div className="flex items-center gap-1 text-xs">
                  <Bell className="w-3 h-3" />
                  <span>{bill.notify_days_before}d reminder</span>
                </div>
              )}
            </div>
            
            {bill.notes && (
              <p className={`text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 ${isPaid ? 'opacity-50' : ''}`}>
                {bill.notes}
              </p>
            )}
          </div>
          
          <div className="flex gap-1 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleAskAI(bill)}
              className="h-8 w-8 flex-shrink-0"
              title="Ask AI for payment advice"
            >
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </Button>
            {bill.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkPaid(bill)}
                className="h-8 text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50 flex-shrink-0"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Mark Paid</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(bill)}
              className="h-8 w-8 flex-shrink-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(bill.id)}
              className="h-8 w-8 text-red-500 hover:text-red-700 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Overdue Bills Section */}
        {overdueBills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-red-300 dark:border-red-700">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
              <h3 className="font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">
                Overdue ({overdueBills.length})
              </h3>
            </div>
            <div className="space-y-3">
              {overdueBills.map(bill => <BillCard key={bill.id} bill={bill} />)}
            </div>
          </div>
        )}

        {/* Due Soon Bills Section */}
        {dueSoonBills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-yellow-300 dark:border-yellow-700">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">
                Due Soon ({dueSoonBills.length})
              </h3>
            </div>
            <div className="space-y-3">
              {dueSoonBills.map(bill => <BillCard key={bill.id} bill={bill} />)}
            </div>
          </div>
        )}

        {/* Upcoming Bills Section */}
        {upcomingBills.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-teal-300 dark:border-teal-700">
              <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                Upcoming ({upcomingBills.length})
              </h3>
            </div>
            <div className="space-y-3">
              {upcomingBills.map(bill => <BillCard key={bill.id} bill={bill} />)}
            </div>
          </div>
        )}

        {/* Paid Bills Section */}
        {paidBills.length > 0 && !hidePaidBills && (
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-green-300 dark:border-green-700">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
                Paid ({paidBills.length})
              </h3>
            </div>
            <div className="space-y-3">
              {paidBills.map(bill => <BillCard key={bill.id} bill={bill} />)}
            </div>
          </div>
        )}
      </div>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              AI Financial Advisor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedBill && (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                <h3 className="font-semibold text-teal-900 dark:text-teal-100 mb-1">
                  {selectedBill.name} - ${selectedBill.amount}
                </h3>
                <p className="text-sm text-teal-700 dark:text-teal-300">
                  Due: {format(new Date(selectedBill.due_date), 'PPP')}
                </p>
              </div>
            )}

            {isAsking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600 dark:text-teal-400" />
              </div>
            ) : (
              <Textarea
                value={aiResponse}
                readOnly
                className="min-h-[300px] bg-gray-50 dark:bg-gray-900"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}