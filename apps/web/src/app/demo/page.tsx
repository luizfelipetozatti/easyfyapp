"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@easyfyapp/ui";
import {
  Calendar,
  MessageCircle,
  LayoutDashboard,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  MapPin,
  Phone,
  ChevronRight,
  User,
  TrendingUp,
  Bell,
} from "lucide-react";

const steps = [
  {
    id: 0,
    slug: "booking",
    label: "1. Agendamento",
    icon: Calendar,
    title: "Seus clientes agendam sem ligar",
    description:
      "Cada negócio recebe uma página pública personalizada. O cliente escolhe o serviço, dia e horário disponível — tudo online, 24 horas por dia.",
  },
  {
    id: 1,
    slug: "dashboard",
    label: "2. Dashboard",
    icon: LayoutDashboard,
    title: "Tudo centralizado no seu painel",
    description:
      "Acompanhe agendamentos do dia, faturamento mensal, taxa de confirmação e muito mais. Gerencie tudo em um único lugar.",
  },
  {
    id: 2,
    slug: "whatsapp",
    label: "3. WhatsApp",
    icon: MessageCircle,
    title: "Confirmações automáticas pelo WhatsApp",
    description:
      "Assim que o agendamento é feito, o cliente recebe uma confirmação instantânea. Lembretes automáticos reduzem faltas em até 70%.",
  },
];

/* ──────────────── Mock: Booking Page ──────────────── */
function BookingMock() {
  const [selected, setSelected] = useState<number | null>(null);

  const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00"];
  const days = [
    { day: "Seg", date: "17" },
    { day: "Ter", date: "18" },
    { day: "Qua", date: "19", active: true },
    { day: "Qui", date: "20" },
    { day: "Sex", date: "21" },
  ];

  return (
    <div className="flex h-full flex-col gap-5 overflow-auto p-6">
      {/* Header org */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
          CS
        </div>
        <div>
          <p className="font-semibold text-sm">Clínica São Lucas</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> São Paulo, SP
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-amber-500">
          <Star className="h-3 w-3 fill-amber-400" /> 4.9
        </div>
      </div>

      {/* Service selection */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Serviço</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Consulta Geral", price: "R$ 150", duration: "30 min" },
            { name: "Retorno", price: "R$ 80", duration: "20 min" },
          ].map((s, i) => (
            <div
              key={i}
              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                i === 0
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary/50"
              }`}
            >
              <p className="text-xs font-medium">{s.name}</p>
              <p className="text-xs text-primary font-semibold mt-1">{s.price}</p>
              <p className="text-xs text-muted-foreground">{s.duration}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Data</p>
        <div className="flex gap-2">
          {days.map((d) => (
            <button
              key={d.date}
              className={`flex-1 rounded-lg py-2 text-center text-xs transition-all ${
                d.active
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <span className="block text-[10px] opacity-70">{d.day}</span>
              <span>{d.date}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Horário</p>
        <div className="grid grid-cols-4 gap-2">
          {slots.map((slot, i) => (
            <button
              key={slot}
              onClick={() => setSelected(i)}
              disabled={i === 2 || i === 5}
              className={`rounded-md py-2 text-xs transition-all font-medium ${
                selected === i
                  ? "bg-primary text-primary-foreground"
                  : i === 2 || i === 5
                  ? "bg-muted text-muted-foreground/40 cursor-not-allowed line-through"
                  : "border hover:border-primary hover:bg-primary/5"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto">
        <button
          className={`w-full rounded-lg py-3 text-sm font-semibold transition-all ${
            selected !== null
              ? "bg-primary text-primary-foreground shadow-sm hover:brightness-105"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {selected !== null ? `Confirmar às ${slots[selected]}` : "Selecione um horário"}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Você receberá confirmação por WhatsApp
        </p>
      </div>
    </div>
  );
}

/* ──────────────── Mock: Dashboard ──────────────── */
function DashboardMock() {
  const stats = [
    { label: "Hoje", value: "8", sub: "agendamentos", icon: Calendar, color: "text-primary" },
    { label: "Este mês", value: "R$ 3.240", sub: "faturamento", icon: TrendingUp, color: "text-emerald-500" },
    { label: "Pendentes", value: "3", sub: "aguardando", icon: Clock, color: "text-amber-500" },
    { label: "Cancelados", value: "1", sub: "este mês", icon: XCircle, color: "text-red-400" },
  ];

  const bookings = [
    { name: "Ana Souza", service: "Consulta Geral", time: "09:00", status: "confirmed" },
    { name: "Bruno Lima", service: "Retorno", time: "09:30", status: "pending" },
    { name: "Carla Dias", service: "Consulta Geral", time: "10:30", status: "confirmed" },
    { name: "Diego Ramos", service: "Consulta Geral", time: "11:00", status: "confirmed" },
  ];

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Sidebar */}
      <div className="flex w-12 flex-col items-center gap-5 border-r bg-muted/30 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Calendar className="h-3.5 w-3.5" />
        </div>
        {[LayoutDashboard, Calendar, User, MessageCircle].map((Icon, i) => (
          <button
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-xs font-semibold">Dashboard</p>
            <p className="text-[10px] text-muted-foreground">Quarta, 19 de Fevereiro</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-primary text-[8px] text-white" />
            </div>
            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
              Dr
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <s.icon className={`h-3 w-3 ${s.color}`} />
                </div>
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Bookings list */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Agenda de Hoje
            </p>
            <div className="space-y-1.5">
              {bookings.map((b, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-semibold shrink-0">
                    {b.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{b.service}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-semibold">{b.time}</p>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-medium ${
                        b.status === "confirmed"
                          ? "bg-primary/10 text-primary"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {b.status === "confirmed" ? "Confirmado" : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Mock: WhatsApp ──────────────── */
function WhatsAppMock() {
  const messages = [
    {
      from: "system",
      text: "Olá, *Ana Souza*! 👋\nSeu agendamento foi *confirmado*.",
      time: "09:01",
    },
    {
      from: "system",
      text: "📅 *Consulta Geral*\n🏥 Clínica São Lucas\n📍 São Paulo, SP\n⏰ Qua, 19/02 · 09:00",
      time: "09:01",
    },
    {
      from: "user",
      text: "Perfeito, obrigada! 😊",
      time: "09:02",
    },
    {
      from: "system",
      text: "⏰ *Lembrete:* Você tem um agendamento amanhã às 09:00 na Clínica São Lucas.\n\nPrecisa reagendar? Responda *SIM* para confirmar ou *NÃO* para cancelar.",
      time: "08:00",
      label: "Lembrete (1 dia antes)",
    },
    {
      from: "user",
      text: "SIM",
      time: "08:05",
    },
    {
      from: "system",
      text: "✅ Ótimo! Até amanhã, Ana. Te esperamos! 🙌",
      time: "08:05",
    },
  ];

  return (
    <div className="flex h-full flex-col bg-[#ECE5DD] dark:bg-zinc-900">
      {/* Chat header */}
      <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
          CS
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold">Clínica São Lucas</p>
          <p className="text-[10px] opacity-70">Sistema Easyfy</p>
        </div>
        <Phone className="h-4 w-4 opacity-70" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-3 py-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.from === "user" ? "items-end" : "items-start"}`}>
            {msg.label && (
              <p className="text-[9px] text-center text-muted-foreground bg-white/60 dark:bg-white/10 rounded px-2 py-0.5 mb-1 self-center">
                {msg.label}
              </p>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
                msg.from === "user"
                  ? "bg-[#DCF8C6] dark:bg-[#025144] rounded-tr-none"
                  : "bg-white dark:bg-zinc-800 rounded-tl-none"
              }`}
            >
              <p
                className="text-xs leading-relaxed"
                style={{ whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{
                  __html: msg.text
                    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                    .replace(/\n/g, "<br/>"),
                }}
              />
              <p className="text-[9px] text-muted-foreground text-right mt-1">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 bg-[#F0F0F0] dark:bg-zinc-800 px-3 py-2">
        <div className="flex-1 rounded-full bg-white dark:bg-zinc-700 px-3 py-1.5 text-[11px] text-muted-foreground">
          Mensagem
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#075E54] text-white">
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Browser Frame ──────────────── */
function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border bg-card shadow-2xl overflow-hidden h-full">
      {/* Chrome bar */}
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5 shrink-0">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="mx-2 flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground max-w-xs">
          <div className="h-2.5 w-2.5 rounded-full bg-primary/50 shrink-0" />
          {url}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

/* ──────────────── Phone Frame (WhatsApp) ──────────────── */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-full max-w-[280px] flex-col rounded-[32px] border-4 border-foreground/10 bg-card shadow-2xl overflow-hidden">
      {/* Notch */}
      <div className="flex h-6 items-center justify-center bg-foreground/5 shrink-0">
        <div className="h-1.5 w-16 rounded-full bg-foreground/20" />
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
      {/* Home bar */}
      <div className="flex h-5 items-center justify-center bg-foreground/5 shrink-0">
        <div className="h-1 w-20 rounded-full bg-foreground/20" />
      </div>
    </div>
  );
}

/* ──────────────── Main Demo Page ──────────────── */
export default function DemoPage() {
  const [activeStep, setActiveStep] = useState(0);
  const step = steps[activeStep];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-bold">Easyfy</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Demo
            </span>
          </div>
          <Link href="/register">
            <Button size="sm">Criar Conta Grátis</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-muted/30 to-background py-12 text-center">
          <div className="container mx-auto px-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Tour interativo
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Veja o Easyfy em ação
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Explore o fluxo completo — do agendamento do cliente até a notificação automática no WhatsApp.
            </p>
          </div>
        </section>

        {/* Step tabs */}
        <div className="sticky top-14 z-10 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex items-center overflow-x-auto px-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = activeStep === i;
              const isDone = i < activeStep;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(i)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition-all ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <section className="container mx-auto px-4 py-10">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">
            {/* Description */}
            <div className="flex-shrink-0 lg:w-72 lg:pt-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <step.icon className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold leading-snug">{step.title}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{step.description}</p>

              {/* Highlights */}
              <ul className="mt-6 space-y-3">
                {activeStep === 0 && [
                  "Página com URL única para o seu negócio",
                  "Exibe apenas horários disponíveis em tempo real",
                  "Funciona em qualquer dispositivo, 24h por dia",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
                {activeStep === 1 && [
                  "Visão completa dos agendamentos do dia",
                  "Faturamento e métricas em tempo real",
                  "Gerencie confirmações e cancelamentos",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
                {activeStep === 2 && [
                  "Confirmação instantânea ao agendar",
                  "Lembrete automático 24h antes",
                  "Cliente confirma ou cancela pelo WhatsApp",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Navigation */}
              <div className="mt-8 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button size="sm" onClick={() => setActiveStep((s) => s + 1)} className="gap-2">
                    Próximo <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Link href="/register">
                    <Button size="sm" className="gap-2">
                      Criar Conta Grátis <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Screen preview */}
            <div className="w-full flex-1" style={{ minHeight: "520px", maxHeight: "600px" }}>
              {activeStep === 0 && (
                <BrowserFrame url="easyfy.app/agendar/clinica-sao-lucas">
                  <BookingMock />
                </BrowserFrame>
              )}
              {activeStep === 1 && (
                <BrowserFrame url="easyfy.app/dashboard">
                  <DashboardMock />
                </BrowserFrame>
              )}
              {activeStep === 2 && (
                <div className="flex h-full items-center justify-center">
                  <div style={{ height: "520px", width: "100%", maxWidth: "320px" }}>
                    <PhoneFrame>
                      <WhatsAppMock />
                    </PhoneFrame>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA bottom */}
        <section className="border-t bg-muted/30 py-16 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold">Pronto para começar?</h2>
            <p className="mt-2 text-muted-foreground">
              Configure seu negócio em menos de 5 minutos. Gratuito para começar.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Criar Conta Grátis <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Easyfy. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
