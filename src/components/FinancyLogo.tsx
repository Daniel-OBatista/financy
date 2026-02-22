export default function FinancyLogo() {
  return (
    <div className="flex items-center">
      <img 
        src="/financy.png" 
        alt="Financy Logo" 
        // w-[134px] define a largura exata e h-[32px] a altura exata do print
        className="w-[134px] h-[32px] object-contain"
      />
    </div>
  );
}
