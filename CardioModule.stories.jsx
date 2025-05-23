import React from 'react';
import CardioModule from './CardioModule';
import { ThemeProvider } from './ThemeContext';

export default {
  title: 'Modules/CardioModule',
  component: CardioModule,
};

const Template = () => (
  <ThemeProvider>
    <CardioModule />
  </ThemeProvider>
);

export const Default = Template.bind({});
