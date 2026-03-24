export type PresetItem = {
  title: string;
  price: string;
  description: string;
};

export type RecentQuotation = {
  id: string;
  customer: string;
  plan: string;
  amount: string;
  date: string;
};

export type InvoiceRow = {
  id: string;
  initials: string;
  initialsClassName: string;
  customer: string;
  amount: string;
  date: string;
  status: "SENT" | "NOT SENT";
};

export const presetItems: PresetItem[] = [
  {
    title: "私人教练包",
    price: "$4,800",
    description: "12节1对1私教课服务内容...",
  },
  {
    title: "年度至尊会员",
    price: "$3,200",
    description: "全年无限次入场及器械使用...",
  },
];

export const recentQuotations: RecentQuotation[] = [
  {
    id: "#Q-2023055",
    customer: "张伟 (Zhang Wei)",
    plan: "高级私人教练包 (12节)",
    amount: "$5,800.00",
    date: "2023.10.24",
  },
  {
    id: "#Q-2023056",
    customer: "李娜 (Li Na)",
    plan: "年度至尊会员权益",
    amount: "$12,000.00",
    date: "2023.10.22",
  },
];

export const invoiceRows: InvoiceRow[] = [
  {
    id: "#INV-2023001",
    initials: "ZW",
    initialsClassName: "bg-[#00A676]/10 text-[#00A676]",
    customer: "张伟 (Zhang Wei)",
    amount: "$ 5,800.00",
    date: "2023-10-24",
    status: "SENT",
  },
  {
    id: "#INV-2023002",
    initials: "LN",
    initialsClassName: "bg-blue-500/10 text-blue-400",
    customer: "李娜 (Li Na)",
    amount: "$ 12,000.00",
    date: "2023-10-22",
    status: "NOT SENT",
  },
  {
    id: "#INV-2023003",
    initials: "XM",
    initialsClassName: "bg-red-500/10 text-red-400",
    customer: "王小明 (Wang XM)",
    amount: "$ 2,400.00",
    date: "2023-10-20",
    status: "SENT",
  },
];
