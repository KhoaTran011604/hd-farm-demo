import { AnimalForm } from '@/components/animals/animal-form';

export default function AnimalNewPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Thêm vật nuôi</h1>
      <AnimalForm />
    </div>
  );
}
