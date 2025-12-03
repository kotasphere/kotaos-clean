
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Plus, TrendingUp } from "lucide-react";
import SubscriptionDialog from "../components/subscriptions/SubscriptionDialog";
import SubscriptionList from "../components/subscriptions/SubscriptionList";
import SubscriptionStats from "../components/subscriptions/SubscriptionStats";

export default function SubscriptionsPage() {
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', user?.email],
    queryFn: () => base44.entities.Subscription.filter({ created_by: user.email }, '-next_renewal'),
    initialData: [],
    enabled: !!user?.email,
  });

  const createSubscription = useMutation({
    mutationFn: (data) => base44.entities.Subscription.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowSubDialog(false);
      setEditingSub(null);
    },
  });

  const updateSubscription = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setShowSubDialog(false);
      setEditingSub(null);
    },
  });

  const deleteSubscription = useMutation({
    mutationFn: (id) => base44.entities.Subscription.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  const handleCreateSub = () => {
    setEditingSub(null);
    setShowSubDialog(true);
  };

  const handleEditSub = (sub) => {
    setEditingSub(sub);
    setShowSubDialog(true);
  };

  const handleSaveSub = (subData) => {
    if (editingSub) {
      updateSubscription.mutate({ id: editingSub.id, data: subData });
    } else {
      createSubscription.mutate(subData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50/30 dark:from-gray-950 dark:to-cyan-950/30 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Subscriptions</h1>
              <p className="text-gray-500 dark:text-gray-400">Track recurring expenses</p>
            </div>
          </div>
          <Button
            onClick={handleCreateSub}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        </div>

        <SubscriptionStats subscriptions={subscriptions} />

        <Card className="p-6 mt-6">
          <SubscriptionList
            subscriptions={subscriptions}
            onEdit={handleEditSub}
            onDelete={(id) => deleteSubscription.mutate(id)}
            isLoading={isLoading}
          />
        </Card>

        <SubscriptionDialog
          open={showSubDialog}
          onClose={() => {
            setShowSubDialog(false);
            setEditingSub(null);
          }}
          onSave={handleSaveSub}
          subscription={editingSub}
        />
      </div>
    </div>
  );
}
