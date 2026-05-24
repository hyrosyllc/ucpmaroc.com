// src/lib/countries.ts

export const SHIPPING_REGIONS = [
  {
    name: "North America (NA)",
    code: "NA",
    countries: ["Canada", "United States of America"]
  },
  {
    name: "Latin America (LATAM)",
    code: "LATAM",
    countries: ["Anguilla", "Antigua and Barbuda", "Argentina", "Aruba", "Bahamas", "Barbados", "Belize", "Bermuda", "Bolivia, Plurinational State of", "Brazil", "Cayman Islands", "Chile", "Colombia", "Costa Rica", "Cuba", "Dominica", "Dominican Republic", "Ecuador", "El Salvador", "Falkland Islands (Malvinas)", "Grenada", "Guatemala", "Guyana", "Haiti", "Honduras", "Jamaica", "Mexico", "Montserrat", "Nicaragua", "Panama", "Paraguay", "Peru", "Puerto Rico", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "South Georgia and the South Sandwich Islands", "Suriname", "Trinidad and Tobago", "Turks and Caicos Islands", "Uruguay", "Venezuela, Bolivarian Republic of", "Virgin Islands, British", "Virgin Islands, U.S."]
  },
  {
    name: "Asia-Pacific (APAC)",
    code: "APAC",
    countries: ["American Samoa", "Australia", "Bangladesh", "Bhutan", "British Indian Ocean Territory", "Brunei Darussalam", "Cambodia", "China", "Christmas Island", "Cocos (Keeling) Islands", "Fiji", "Guam", "Hong Kong", "India", "Indonesia", "Japan", "Kiribati", "Korea, Democratic People's Republic of", "Korea, Republic of", "Lao People's Democratic Republic", "Macao", "Malaysia", "Maldives", "Marshall Islands", "Micronesia, Federated States of", "Mongolia", "Myanmar", "Nauru", "Nepal", "New Zealand", "Niue", "Norfolk Island", "Northern Mariana Islands", "Pakistan", "Palau", "Papua New Guinea", "Philippines", "Pitcairn", "Samoa", "Singapore", "Solomon Islands", "Sri Lanka", "Taiwan, Province of China", "Thailand", "Timor-Leste", "Tokelau", "Tonga", "Tuvalu", "United States Minor Outlying Islands", "Vanuatu", "Vietnam"]
  },
  {
    name: "Europe, Middle East & Africa (EMEA)",
    code: "EMEA",
    countries: ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antarctica", "Armenia", "Austria", "Azerbaijan", "Bahrain", "Belarus", "Belgium", "Benin", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Collectivity of Saint Martin", "Comoros", "Congo", "Congo, the Democratic Republic of the", "Croatia", "Curaçao", "Cyprus", "Czechia", "Côte d'Ivoire", "Denmark", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Faroe Islands", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibralta", "Greece", "Greenland", "Guadeloupe", "Guernsey", "Guinea", "Guinea-Bissau", "Heard Island and McDonald Islands", "Holy See", "Hungary", "Iceland", "Iran, Islamic Republic of", "Iraq", "Ireland", "Isle of Man", "Palestine", "Italy", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia, the former Yugoslav Republic of", "Madagascar", "Malawi", "Mali", "Malta", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Moldova, Republic of", "Monaco", "Montenegro", "Morocco", "Mozambique", "Namibia", "Netherlands", "New Caledonia", "Niger", "Nigeria", "Norway", "Oman", "Palestine, State of", "Portugal", "Qatar", "Romania", "Russian Federation", "Rwanda", "Réunion", "Saint Barthélemy", "Saint Helena, Ascension and Tristan da Cunha", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Sint Maarten", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Sudan", "Spain", "Sudan", "Svalbard and Jan Mayen", "Swaziland", "Sweden", "Switzerland", "Syrian Arab Republic", "Tajikistan", "Tanzania, United Republic of", "Togo", "Tunisia", "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom of Great Britain and Northern Ireland", "Uzbekistan", "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe", "Åland Islands"]
  }
];

export const ALL_COUNTRIES_LIST = SHIPPING_REGIONS.flatMap(r => r.countries);
export const ALL_COUNTRIES_STRING = ALL_COUNTRIES_LIST.join(", ");
