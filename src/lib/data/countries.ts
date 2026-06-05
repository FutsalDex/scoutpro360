export interface Region {
  name: string;
  countries: string[];
}

export const COUNTRIES_BY_REGION: Region[] = [
  {
    name: "Asia y Pacífico Sur",
    countries: [
      "Afganistán", "Arabia Saudí", "Australia", "Bahréin", "Bangladesh", "Brunéi", "Bután", "Camboya", "Catar", "China", 
      "Corea (Rep. de)", "Emiratos Árabes Unidos", "Estado de Palestina", "Filipinas", "Fiyi", "India", "Indonesia", 
      "Irak", "Irán", "Japón", "Jordania", "Kazajstán", "Kirguistán", "Kiribati", "Kuwait", "Líbano", "Malasia", 
      "Maldivas", "Marshall (Islas)", "Micronesia (Estados Federados de)", "Mongolia", "Myanmar", "Nauru", "Nepal", 
      "Nueva Zelanda", "Omán", "Pakistán", "Palaos", "Papúa Nueva Guinea", "RDP Lao", "Salomón (Islas)", "Samoa", 
      "Singapur", "Siria", "Sri Lanka", "Tailandia", "Tayikistán", "Timor-Leste", "Tonga", "Turkmenistán", "Uzbekistán", 
      "Vanuatu", "Vietnam", "Yemen"
    ]
  },
  {
    name: "Europa",
    countries: [
      "Albania", "Alemania", "Andorra", "Armenia", "Austria", "Azerbaiyán", "Belarrús", "Bosnia-Herzegovina", "Bulgaria", 
      "Bélgica", "Chipre", "Croacia", "Dinamarca", "Eslovaquia", "Eslovenia", "España", "Estado de la Ciudad del Vaticano", 
      "Estonia", "Finlandia", "Francia", "Georgia", "Grecia", "Hungría", "Irlanda", "Islandia", "Israel", "Italia", 
      "Letonia", "Liechtenstein", "Lituania", "Luxemburgo", "Macedonia del Norte", "Malta", "Moldova", "Montenegro", 
      "Mónaco", "Noruega", "Países Bajos", "Polonia", "Portugal", "Reino Unido", "Rep. Checa", "Rumania", "Rusia", 
      "San Marino", "Serbia", "Suecia", "Suiza", "Türkiye", "Ucrania"
    ]
  },
  {
    name: "Las Américas",
    countries: [
      "Antigua y Barbuda", "Argentina", "Aruba", "Bahamas", "Barbados", "Belice", "Bolivia", "Brasil", "Canadá", "Chile", 
      "Colombia", "Costa Rica", "Cuba", "Curazao", "Dominica", "Ecuador", "El Salvador", "Estados Unidos", "Granada", 
      "Guatemala", "Guyana", "Haití", "Honduras", "Jamaica", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", 
      "Rep. Dominicana", "San Cristóbal y Nieves", "San Martín", "San Vicente y las Granadinas", "Santa Lucía", 
      "Surinam", "Trinidad y Tobago", "Uruguay", "Venezuela"
    ]
  },
  {
    name: "África",
    countries: [
      "Angola", "Argelia", "Benín", "Botsuana", "Burkina Faso", "Burundi", "Cabo Verde", "Camerún", "Chad", "Comoras", 
      "Congo", "Congo (Rep. Democrática del)", "Côte d'Ivoire", "Egipto", "Eritrea", "Eswatini", "Etiopía", "Gabón", 
      "Gambia", "Ghana", "Guinea", "Guinea Bissau", "Guinea Ecuatorial", "Kenia", "Lesoto", "Liberia", "Libia", 
      "Madagascar", "Malaui", "Malí", "Marruecos", "Mauricio", "Mauritania", "Mozambique", "Namibia", "Nigeria", 
      "Níger", "Rep. Centroafricana", "Ruanda", "Santo Tomé y Príncipe", "Senegal", "Seychelles", "Sierra Leona", 
      "Somalia", "Sudáfrica", "Sudán", "Sudán del Sur", "Tanzania", "Togo", "Túnez", "Uganda", "Yibuti", "Zambia", "Zimbabue"
    ]
  }
];

export const ALL_COUNTRIES = COUNTRIES_BY_REGION.flatMap(r => r.countries).sort();
