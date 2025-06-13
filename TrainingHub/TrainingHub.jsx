import ProgramList from "./Components/ProgramList";
import ProgramVault from "./Components/ProgramVault";

export default function TrainingHub() {
  return (
    <div className="px-6 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">🏋️‍♂️ Προγράμματα Προπόνησης</h1>
      <ProgramVault userTier="Silver" />
    </div>
  );
}
