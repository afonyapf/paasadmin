import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Tariff } from "@shared/schema";

export default function TariffsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tariffs, isLoading } = useQuery({
    queryKey: ["/api/tariffs"],
    queryFn: async () => {
      const response = await fetch("/api/tariffs", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tariffs");
      }
      return response.json();
    },
  });

  const deleteTariffMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tariffs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tariffs"] });
      toast({
        title: "Tariff deleted",
        description: "The tariff has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (tariff: Tariff) => {
    // TODO: Implement tariff edit modal
    console.log("Edit tariff:", tariff);
  };

  const handleDelete = (tariff: Tariff) => {
    if (confirm("Are you sure you want to delete this tariff?")) {
      deleteTariffMutation.mutate(tariff.id);
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Tariff Plans</h2>
            <p className="text-sm text-muted-foreground">Manage pricing plans and features</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle>Tariff Management</CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Tariff
              </Button>
            </div>
          </CardHeader>

          {/* Tariffs Table */}
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Features</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Created</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tariffs?.map((tariff: Tariff) => (
                      <tr key={tariff.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-secondary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{tariff.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {tariff.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium">
                          {formatPrice(tariff.price)}
                          <span className="text-muted-foreground">/month</span>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(tariff.features || {}).slice(0, 3).map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {Object.keys(tariff.features || {}).length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{Object.keys(tariff.features || {}).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={tariff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {tariff.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(tariff.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(tariff)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(tariff)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
