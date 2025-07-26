import React from "react";
import clsx from "clsx";

export type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={clsx("bg-white rounded-xl shadow-sm border", className)}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={clsx("p-4 border-b border-gray-200", className)}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ children, className }) => {
  return (
    <h3 className={clsx("text-lg font-semibold text-gray-900", className)}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={clsx("p-4", className)}>
      {children}
    </div>
  );
};
