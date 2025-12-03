import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Receipt, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillDialog from "../components/bills/BillDialog";
import BillList from "../components/bills/BillList";
import BillStats from "../components/bills/BillStats";
import BillCalendar from "../components/bills/BillCalendar";

export default function BillsPage() {
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('list');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bills, isLoading } = useQuery({
    queryKey: ['bills', user?.email],
    queryFn: () => base44.entities.Bill.filter({ created_by: user.email }, '-due_date'),
    initialData: [],
    enabled: !!user?.email, // Changed from !!user to !!user?.email
  });

  const createBill = useMutation({
    mutationFn: (data) => base44.entities.Bill.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setShowBillDialog(false);
      setEditingBill(null);
    },
  });

  const updateBill = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await base44.entities.Bill.update(id, data);
      
      // If bill is being marked as paid, clear any related notifications
      if (data.status === 'paid' && user?.id) {
        const notifications = await base44.entities.Notification.filter({
          user_id: user.id,
          type: 'bill_due',
          read: false
        });
        
        // Mark all bill_due notifications as read
        notifications.forEach(n => {
          base44.entities.Notification.update(n.id, { read: true })
            .catch(err => console.error('Failed to mark notification as read:', err));
        });
        
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setShowBillDialog(false);
      setEditingBill(null);
    },
  });

  const deleteBill = useMutation({
    mutationFn: (id) => base44.entities.Bill.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });

  useEffect(() => {
    if (!user?.id || !base44?.entities?.Notification) return;
    
    base44.entities.Notification.filter({ user_id: user.id, type: 'bill_due', read: false })
      .then(notifications => {
        if (notifications && Array.isArray(notifications)) {
          notifications.forEach(n => {
            base44.entities.Notification.update(n.id, { read: true });
          });
        }
      })
      .catch(err => console.error('Failed to mark notifications as read:', err));
  }, [user?.id]);

  const handleCreateBill = () => {
    setEditingBill(null);
    setShowBillDialog(true);
  };

  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setShowBillDialog(true);
  };

  const handleSaveBill = (billData) => {
    if (editingBill) {
      updateBill.mutate({ id: editingBill.id, data: billData });
    } else {
      createBill.mutate(billData);
    }
  };

  const filteredBills = bills.filter(bill => {
    if (statusFilter === 'all') return true;
    return bill.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-950 dark:to-orange-950/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bills</h1>
              <p className="text-gray-500 dark:text-gray-400">Track payments and due dates</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => setView('list')}
              size="sm"
            >
              List
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'outline'}
              onClick={() => setView('calendar')}
              size="sm"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              onClick={handleCreateBill}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Bill
            </Button>
          </div>
        </div>

        <BillStats bills={bills} />

        {view === 'calendar' ? (
          <Card className="p-6 mt-6">
            <BillCalendar
              bills={bills}
              onBillClick={handleEditBill}
              onCreateBill={handleCreateBill}
            />
          </Card>
        ) : (
          <Card className="p-6 mt-6">
            <div className="mb-6">
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">All Bills</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <BillList
              bills={filteredBills}
              onEdit={handleEditBill}
              onDelete={(id) => deleteBill.mutate(id)}
              onMarkPaid={(bill) => updateBill.mutate({ id: bill.id, data: { ...bill, status: 'paid' } })}
              isLoading={isLoading}
            />
          </Card>
        )}

        <BillDialog
          open={showBillDialog}
          onClose={() => {
            setShowBillDialog(false);
            setEditingBill(null);
          }}
          onSave={handleSaveBill}
          bill={editingBill}
        />
      </div>
    </div>
  );
}