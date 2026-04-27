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
    name: "Group 1 - Tuesday",
    students: [
      { name: "Alison Karina Gonzales", id: "118132241" },
      { name: "David Alejandro Guayan", id: "118026133" },
      { name: "Dilan Stanley Ramirez", id: "118866770" },
      { name: "Ilan Benitez", id: "118866783" },
      { name: "Juan Camilo Alzate", id: "114509488" },
      { name: "Juan David Ossa", id: "117087464" },
      { name: "Juan Esteban Grisales", id: "118866769" },
      { name: "Juan Felipe Mafla", id: "117074117" },
      { name: "Juan Jose Zuleta", id: "115398321" },
      { name: "Juan Manuel Ocampo", id: "118052964" },
      { name: "Juan Manuel Ibarra", id: "118547195" },
      { name: "Juan Sebastian Osorio", id: "117137799" },
      { name: "Juanita Zapata", id: "115898246" },
      { name: "Julian Castaño", id: "118008077" },
      { name: "Laura Sofia Marin", id: "115358261" },
      { name: "Laura Sofia Noriega", id: "123128954" },
      { name: "Laura Sophia Gaviria", id: "118059402" },
      { name: "Luisa Aristizabal Luisa", id: "115370690" },
      { name: "Luisa María Rubio", id: "111418172" },
      { name: "Luz Dayana Gallego", id: "118866800" },
      { name: "Manuela Galeano", id: "123129916" },
      { name: "Margaret Pacheco", id: "117087105" },
      { name: "Maria Camila Ramirez", id: "118866728" },
      { name: "Mariana Serna Jaramillo", id: "114500074" },
      { name: "Mariana Urazan", id: "115393675" },
      { name: "Nestor Nestor Forero", id: "123315320" },
      { name: "Sebastian Arias", id: "111392204" },
      { name: "Test Student", id: "270135718" },
      { name: "Valentina Vargas", id: "118061634" },
    ],
  },
  {
    id: "group-2",
    name: "Group 2 - Monday",
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
