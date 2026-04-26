export type CanvasStudent = {
  id: string;
  name: string;
};

export type CanvasStudentGroup = {
  id: string;
  name: string;
  students: CanvasStudent[];
};

export const canvasStudentGroups: CanvasStudentGroup[] = [
  {
    id: "group-1",
    name: "Group 1",
    students: [
      { name: "Melanie Aristizabal", id: "115475749" },
      { name: "Sergio Jacobo Calle Calle", id: "118917582" },
      { name: "Jeyson Castañeda", id: "113638143" },
      { name: "Juan Manuel Castaño Castañeda", id: "114435632" },
      { name: "Johan Felipe Galvis Salazar", id: "111110714" },
      { name: "Lucia Gomez Lucia", id: "117078120" },
      { name: "Jhoselyn Nicole Hurtado", id: "118026193" },
      { name: "Juan Miguel Lopez Lopez", id: "115370750" },
      { name: "Angie Ximena Marín Duque", id: "116007086" },
      { name: "Isabella Morera Morera", id: "117063650" },
      { name: "Isabella Mosquera Copete", id: "116977153" },
      { name: "Renteria Ximena Mosquera Renteria", id: "118037282" },
      { name: "Maria José Muñoz", id: "115396512" },
      { name: "Maria Camila Pineda Pineda", id: "111392189" },
      { name: "Geovanny Renteria Renteria", id: "115396826" },
      { name: "Camilo Ruiz", id: "115611749" },
      { name: "Carlos Andres Vallejo Vallejo", id: "116588240" },
      { name: "Pablo Steban Vargas Vargas", id: "116935620" },
    ],
  },
];
