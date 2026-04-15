"use client";

import { useEffect, useState } from "react";
import { InvoicePageView } from "@/components/invoice/InvoicePageView";
import { InvoiceScaffold } from "@/components/invoice/InvoiceScaffold";
import { AuthLoadingScreen } from "@/features/auth/AuthLoadingScreen";
import { AuthLoginScreen } from "@/features/auth/AuthLoginScreen";
import { useAuth } from "@/features/auth/useAuth";
import { getInitialLocale, persistLocale, type AppLocale } from "@/lib/locale";
import { presetItems, recentQuotations } from "@/components/invoice/mockData";
import { fetchCustomerProfiles, fetchInvoices, type CustomerProfile, type InvoiceRecord } from "@/lib/supabase";

// cspell:ignore supabase

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
  const [activeLocale, setActiveLocale] = useState<AppLocale>(() => getInitialLocale());

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
      activeLocale={activeLocale}
      onToggleLocale={() => {
        setActiveLocale((prev) => {
          const next = prev === "zh" ? "en" : "zh";
          persistLocale(next);
          return next;
        });
      }}
      onSignOut={handleSignOut}
    >
      <InvoicePageView
        presetItems={presetItems}
        recentQuotations={recentQuotations}
        invoiceRows={invoices}
        customerProfilesFromDb={customers}
        activeLocale={activeLocale}
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
