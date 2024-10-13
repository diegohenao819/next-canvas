import CreateQuizForm from '@/components/CreateQuizForm';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1>Create a New Quiz in Canvas</h1>
      <CreateQuizForm />
    </div>
  );
}
