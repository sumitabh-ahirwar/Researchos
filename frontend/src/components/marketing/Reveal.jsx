import { motion, useReducedMotion } from "framer-motion";

/**
 * Scroll-reveal wrapper.
 *
 * `viewport.once` means an element animates in a single time — re-animating on
 * every scroll-by is the thing that makes marketing pages feel busy. When the
 * OS asks for reduced motion the transform is dropped entirely and content
 * renders in place, rather than animating faster.
 */
export default function Reveal({ children, delay = 0, y = 16, className, as = "div" }) {
  const reduced = useReducedMotion();
  const Component = motion[as] ?? motion.div;

  if (reduced) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}
