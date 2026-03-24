"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { AuthLoadingScreen } from "@/features/auth/AuthLoadingScreen";
import { AuthLoginScreen } from "@/features/auth/AuthLoginScreen";
import { InvoicePageView } from "@/components/invoice/InvoicePageView";
import { presetItems, recentQuotations } from "@/components/invoice/mockData";
import { InvoiceScaffold } from "@/components/invoice/InvoiceScaffold";
import { fetchCustomerProfiles, fetchInvoices, type CustomerProfile, type InvoiceRecord } from "@/lib/supabase";

export default function NewInvoicePage() {
  const {
    authState,
    email,
    setEmail,
    password,
    setPassword,
    authError,
    profile,
    handleSignIn,
    handleSignOut,
  } = useAuth();

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadPageData() {
      const [customersResult, invoicesResult] = await Promise.allSettled([fetchCustomerProfiles(), fetchInvoices()]);
      if (!mounted) return;

      if (customersResult.status === "fulfilled") {
        setCustomers(customersResult.value);
      } else {
        setCustomers([]);
      }

      if (invoicesResult.status === "fulfilled") {
        setInvoices(invoicesResult.value);
      } else {
        setInvoices([]);
      }


    }

    loadPageData();

    return () => {
      mounted = false;
    };
  }, []);

  if (authState === "loading") {
    return <AuthLoadingScreen />;
  }

  if (authState !== "authed") {
    return (
      <AuthLoginScreen
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authError={authError}
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <InvoiceScaffold
      profileName={profile?.full_name ?? undefined}
      profileEmail={profile?.email || email}
      profileRole={profile?.role ?? undefined}
      onSignOut={handleSignOut}
    >
      <InvoicePageView
        presetItems={presetItems}
        recentQuotations={recentQuotations}
        invoiceRows={invoices}
        customerProfilesFromDb={customers}
        showBuilderSection={true}
        showListSection={false}
        onRequestInvoicesRefresh={async () => {
          const next = await fetchInvoices();
          setInvoices(next);
        }}
      />
    </InvoiceScaffold>
  );
}
