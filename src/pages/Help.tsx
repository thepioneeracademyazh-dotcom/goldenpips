import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageCircle, Mail, TrendingUp, Shield, CreditCard } from 'lucide-react';

const faqs = [
  {
    question: "What are trading signals?",
    answer: "Trading signals are recommendations that indicate potential entry and exit points for trades. Our signals include entry price, take profit levels (TP1, TP2), and stop loss to help you manage risk effectively."
  },
  {
    question: "How do I use the signals?",
    answer: "When you receive a signal, note the entry price, set your take profit at TP1 or TP2, and always set a stop loss as indicated. Never risk more than you can afford to lose."
  },
  {
    question: "What's the difference between Free and Premium?",
    answer: "Free users get access to limited signals with basic information. Premium subscribers receive all signals in real-time with full details, priority support, and higher success rate signals."
  },
  {
    question: "How do I subscribe to Premium?",
    answer: "Navigate to the Subscription page and click 'Subscribe Now'. You can pay using cryptocurrency through our secure payment gateway."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Premium subscriptions are valid for 30 days from the date of purchase. They do not auto-renew, so you have full control over your subscription."
  },
  {
    question: "How accurate are the signals?",
    answer: "Our signals are based on technical analysis and market research. While we strive for accuracy, trading always carries risk. Always use proper risk management."
  }
];

export default function Help() {
  return (
    <AppLayout showLogo={false} headerTitle="Help Center" headerSubtitle="Find answers to common questions">
      <div className="p-4 pb-24 max-w-lg mx-auto">

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="card-trading cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-3 flex flex-col items-center text-center">
              <TrendingUp className="w-5 h-5 text-primary mb-1" />
              <span className="text-xs text-foreground">Signals</span>
            </CardContent>
          </Card>
          <Card className="card-trading cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-3 flex flex-col items-center text-center">
              <CreditCard className="w-5 h-5 text-primary mb-1" />
              <span className="text-xs text-foreground">Payments</span>
            </CardContent>
          </Card>
          <Card className="card-trading cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-3 flex flex-col items-center text-center">
              <Shield className="w-5 h-5 text-primary mb-1" />
              <span className="text-xs text-foreground">Security</span>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="card-trading mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border">
                  <AccordionTrigger className="text-sm text-foreground hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="card-trading">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Need More Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a 
              href="mailto:goldenpipsofficial1@gmail.com" 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Email Support</p>
                <p className="text-xs text-muted-foreground">goldenpipsofficial1@gmail.com</p>
              </div>
            </a>
            <a 
              href="https://t.me/goldenpips" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Telegram Support</p>
                <p className="text-xs text-muted-foreground">@goldenpips</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
