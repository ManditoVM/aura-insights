
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','employee','customer');
CREATE TYPE public.order_status AS ENUM ('pendiente','confirmado','preparando','enviado','entregado','cancelado');
CREATE TYPE public.movement_type AS ENUM ('entrada','salida','ajuste');
CREATE TYPE public.alert_severity AS ENUM ('info','success','warning','critical','insight');
CREATE TYPE public.insight_type AS ENUM ('riesgo_agotamiento','baja_rotacion','alta_demanda','anomalia','recomendacion','resumen');

-- ============ UTIL ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','employee'));
$$;

CREATE POLICY "profiles_select_own_or_staff" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "user_roles_select_own_or_staff" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- ============ CATALOGO ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "categories_staff_write" ON public.categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  max_stock INTEGER NOT NULL DEFAULT 200,
  active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "products_staff_all" ON public.products FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX products_category_idx ON public.products(category_id);

-- ============ CLIENTES ============
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_staff_all" ON public.customers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "customers_select_own" ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "customers_update_own" ON public.customers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "customers_insert_own" ON public.customers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE TRIGGER customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PEDIDOS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT ('ORD-' || upper(substr(md5(gen_random_uuid()::text),1,8))),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'pendiente',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  notes TEXT,
  created_by UUID,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_staff_all" ON public.orders FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = orders.customer_id AND c.user_id = auth.uid()));
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = orders.customer_id AND c.user_id = auth.uid()));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX orders_customer_idx ON public.orders(customer_id);
CREATE INDEX orders_created_idx ON public.orders(created_at);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_staff_all" ON public.order_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "order_items_own" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o JOIN public.customers c ON c.id=o.customer_id
                 WHERE o.id = order_items.order_id AND c.user_id = auth.uid()));
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o JOIN public.customers c ON c.id=o.customer_id
                 WHERE o.id = order_items.order_id AND c.user_id = auth.uid()));
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
CREATE INDEX order_items_product_idx ON public.order_items(product_id);

-- ============ INVENTARIO ============
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type public.movement_type NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  stock_before INTEGER NOT NULL DEFAULT 0,
  stock_after INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  reference TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movements_staff_all" ON public.inventory_movements FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX movements_product_idx ON public.inventory_movements(product_id, created_at);

-- ============ TRANSACCIONES / AUDITORIA ============
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  description TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_staff_read" ON public.transactions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "transactions_staff_insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX transactions_created_idx ON public.transactions(created_at);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_admin_read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit_staff_insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX audit_created_idx ON public.audit_logs(created_at);

-- ============ INTELIGENCIA ============
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity public.alert_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_staff_all" ON public.alerts FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.insight_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'insight',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3),
  source TEXT NOT NULL DEFAULT 'calculo',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insights_staff_all" ON public.ai_insights FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  horizon_days INTEGER NOT NULL DEFAULT 7,
  estimated_demand NUMERIC(12,2) NOT NULL,
  trend TEXT NOT NULL DEFAULT 'estable',
  confidence NUMERIC(4,3),
  method TEXT NOT NULL DEFAULT 'regresion_lineal',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions_staff_all" ON public.predictions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ AUTOMATIZACION: alerta de stock minimo ============
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stock <= NEW.min_stock THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.entity = 'product' AND a.entity_id = NEW.id AND a.read = false
        AND a.severity IN ('warning'::public.alert_severity,'critical'::public.alert_severity)
    ) THEN
      INSERT INTO public.alerts (severity, title, message, entity, entity_id)
      VALUES (
        (CASE WHEN NEW.stock = 0 THEN 'critical' ELSE 'warning' END)::public.alert_severity,
        CASE WHEN NEW.stock = 0 THEN 'Producto agotado' ELSE 'Stock por debajo del mínimo' END,
        NEW.name || ' tiene ' || NEW.stock || ' unidades (mínimo ' || NEW.min_stock || ').',
        'product', NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER products_low_stock AFTER INSERT OR UPDATE OF stock ON public.products
FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();

-- ============ MOVIMIENTO DE INVENTARIO TRANSACCIONAL ============
CREATE OR REPLACE FUNCTION public.register_movement(
  _product_id UUID, _type public.movement_type, _quantity INTEGER,
  _reason TEXT DEFAULT NULL, _reference TEXT DEFAULT NULL, _order_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _before INTEGER; _after INTEGER; _mid UUID; _name TEXT;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF _quantity <= 0 THEN RAISE EXCEPTION 'La cantidad debe ser mayor a cero'; END IF;

  SELECT stock, name INTO _before, _name FROM public.products WHERE id = _product_id FOR UPDATE;
  IF _before IS NULL THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;

  _after := CASE WHEN _type = 'entrada' THEN _before + _quantity
                 WHEN _type = 'salida' THEN _before - _quantity
                 ELSE _quantity END;
  IF _after < 0 THEN RAISE EXCEPTION 'Stock insuficiente para % (disponible %)', _name, _before; END IF;

  UPDATE public.products SET stock = _after WHERE id = _product_id;

  INSERT INTO public.inventory_movements (product_id, type, quantity, stock_before, stock_after, reason, reference, order_id, user_id)
  VALUES (_product_id, _type, CASE WHEN _type='ajuste' THEN GREATEST(abs(_after-_before),1) ELSE _quantity END,
          _before, _after, _reason, _reference, _order_id, auth.uid())
  RETURNING id INTO _mid;

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  VALUES (auth.uid(), 'movimiento_' || _type::text, 'product', _product_id,
          jsonb_build_object('stock', _before), jsonb_build_object('stock', _after));
  RETURN _mid;
END; $$;
GRANT EXECUTE ON FUNCTION public.register_movement(UUID, public.movement_type, INTEGER, TEXT, TEXT, UUID) TO authenticated;

-- ============ CONFIRMACION DE PEDIDO (ATOMICA) ============
CREATE OR REPLACE FUNCTION public.confirm_order(_order_id UUID)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.orders; _it RECORD; _before INTEGER; _after INTEGER;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'Pedido no encontrado'; END IF;
  IF _o.status <> 'pendiente' THEN RAISE EXCEPTION 'Solo se pueden confirmar pedidos pendientes'; END IF;

  FOR _it IN SELECT oi.product_id, oi.quantity, p.name, p.stock
             FROM public.order_items oi JOIN public.products p ON p.id = oi.product_id
             WHERE oi.order_id = _order_id
  LOOP
    IF _it.stock < _it.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente de % (disponible %, requerido %)', _it.name, _it.stock, _it.quantity;
    END IF;
  END LOOP;

  FOR _it IN SELECT oi.product_id, oi.quantity FROM public.order_items oi WHERE oi.order_id = _order_id
  LOOP
    SELECT stock INTO _before FROM public.products WHERE id = _it.product_id FOR UPDATE;
    _after := _before - _it.quantity;
    UPDATE public.products SET stock = _after WHERE id = _it.product_id;
    INSERT INTO public.inventory_movements (product_id, type, quantity, stock_before, stock_after, reason, reference, order_id, user_id)
    VALUES (_it.product_id, 'salida', _it.quantity, _before, _after, 'Confirmación de pedido', _o.code, _order_id, auth.uid());
  END LOOP;

  UPDATE public.orders SET status = 'confirmado', confirmed_at = now() WHERE id = _order_id RETURNING * INTO _o;

  INSERT INTO public.transactions (type, amount, order_id, customer_id, description, user_id)
  VALUES ('venta', _o.total, _o.id, _o.customer_id, 'Venta confirmada ' || _o.code, auth.uid());

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  VALUES (auth.uid(), 'confirmar_pedido', 'order', _o.id,
          jsonb_build_object('status','pendiente'), jsonb_build_object('status','confirmado','total',_o.total));
  RETURN _o;
END; $$;
GRANT EXECUTE ON FUNCTION public.confirm_order(UUID) TO authenticated;

-- ============ DATOS DEMO (FICTICIOS) ============
INSERT INTO public.categories (name, description) VALUES
 ('Laptops','Equipos portátiles de cómputo'),
 ('Smartphones','Teléfonos inteligentes'),
 ('Accesorios','Periféricos y accesorios'),
 ('Audio','Audio y sonido'),
 ('Monitores','Pantallas y monitores'),
 ('Almacenamiento','Discos y memorias');

DO $$
DECLARE
  cats UUID[]; i INTEGER; nm TEXT; cat UUID; pr NUMERIC; cst NUMERIC;
  names TEXT[] := ARRAY[
   'Laptop Pro X14','Laptop Air 13','Laptop Gamer RX','Laptop Business B5','Laptop Studio S16',
   'Smartphone Nova 5','Smartphone Nova Lite','Smartphone Titan Max','Smartphone Eco 3','Smartphone Zen 7',
   'Mouse Óptico M1','Teclado Mecánico K2','Hub USB-C 7en1','Base Enfriadora','Mochila Tech 15',
   'Cargador GaN 65W','Cable HDMI 2.1','Adaptador Ethernet','Soporte Ergonómico','Webcam HD Pro',
   'Audífonos ANC H9','Audífonos In-Ear E2','Bocina Bluetooth B4','Barra de Sonido S2','Micrófono Studio M7',
   'Monitor 24 FHD','Monitor 27 QHD','Monitor 32 4K','Monitor Curvo 34','Monitor Portátil 15',
   'SSD NVMe 1TB','SSD NVMe 2TB','Disco Externo 4TB','Memoria USB 128GB','MicroSD 256GB',
   'RAM DDR5 16GB','RAM DDR5 32GB','Enclosure NVMe','Docking Station Pro','NAS Personal 2 Bahías'];
  brands TEXT[] := ARRAY['Aurora','Nexus','Vertex','Lumina','Orion'];
BEGIN
  SELECT array_agg(id ORDER BY name) INTO cats FROM public.categories;
  FOR i IN 1..40 LOOP
    nm := names[i];
    cat := cats[1 + ((i-1)/7) % array_length(cats,1)];
    pr := round((300 + (i*137 % 25000))::numeric, 2);
    cst := round(pr * 0.62, 2);
    INSERT INTO public.products (sku, name, description, category_id, brand, price, cost, stock, min_stock, max_stock, created_at)
    VALUES ('AUR-' || lpad(i::text,4,'0'), nm,
            nm || ' — producto de demostración con especificaciones estándar para el catálogo AURA AI.',
            cat, brands[1 + (i % 5)], pr, cst, 0, 8 + (i % 10), 150 + (i % 5) * 50,
            now() - ((120 - i) || ' days')::interval);
  END LOOP;
END $$;

DO $$
DECLARE
  first_names TEXT[] := ARRAY['Ana','Luis','María','Carlos','Sofía','Jorge','Elena','Diego','Paola','Andrés',
                              'Lucía','Miguel','Valeria','Ricardo','Fernanda','Héctor','Camila','Raúl','Daniela','Iván',
                              'Gabriela','Sergio','Mónica','Tomás','Isabel','Óscar','Renata','Emilio','Patricia','Julián'];
  last_names TEXT[] := ARRAY['Garcia','Hernandez','Martinez','Lopez','Ramirez','Torres','Flores','Vargas','Mendoza','Castillo'];
  cities TEXT[] := ARRAY['Ciudad de México','Guadalajara','Monterrey','Puebla','Querétaro','Mérida'];
  i INTEGER;
BEGIN
  FOR i IN 1..30 LOOP
    INSERT INTO public.customers (first_name, last_name, email, phone, address, city, created_at)
    VALUES (first_names[i], last_names[1 + (i % 10)],
            'cliente' || i || '.' || lower(last_names[1 + (i % 10)]) || '@demo-aura.mx',
            '55' || lpad(((i*3717) % 100000000)::text, 8, '0'),
            'Av. Demo ' || (100 + i*7) || ', Col. Ficticia', cities[1 + (i % 6)],
            now() - ((150 - i*3) || ' days')::interval);
  END LOOP;
END $$;

DO $$
DECLARE
  d INTEGER; k INTEGER; n_orders INTEGER; oid UUID; cid UUID; pid UUID;
  qty INTEGER; uprice NUMERIC; sub NUMERIC; items INTEGER; j INTEGER;
  odate TIMESTAMPTZ; st public.order_status; pm TEXT;
  pay TEXT[] := ARRAY['efectivo','tarjeta','transferencia'];
  hot UUID; slow UUID;
BEGIN
  SELECT id INTO hot FROM public.products WHERE sku = 'AUR-0001';
  SELECT id INTO slow FROM public.products WHERE sku = 'AUR-0040';

  FOR d IN REVERSE 89..0 LOOP
    n_orders := 2 + ((d * 7919) % 4) + CASE WHEN d < 21 THEN 1 ELSE 0 END;
    FOR k IN 1..n_orders LOOP
      odate := date_trunc('day', now()) - (d || ' days')::interval + ((6 + (k*3) % 12) || ' hours')::interval;
      SELECT id INTO cid FROM public.customers ORDER BY md5(d::text || k::text || id::text) LIMIT 1;
      st := (CASE WHEN d = 0 THEN 'pendiente'
                  WHEN d < 3 AND k = 1 THEN 'pendiente'
                  WHEN (d*k) % 23 = 0 THEN 'cancelado'
                  WHEN d < 5 THEN 'enviado'
                  ELSE 'entregado' END)::public.order_status;
      pm := pay[1 + ((d+k) % 3)];
      INSERT INTO public.orders (customer_id, status, payment_method, created_at, updated_at, confirmed_at)
      VALUES (cid, st, pm, odate, odate, CASE WHEN st IN ('pendiente','cancelado') THEN NULL ELSE odate END)
      RETURNING id INTO oid;

      items := 1 + ((d + k) % 3);
      sub := 0;
      FOR j IN 1..items LOOP
        IF j = 1 AND (d % 3 = 0) THEN pid := hot;
        ELSE SELECT id INTO pid FROM public.products WHERE id <> slow ORDER BY md5(d::text||k::text||j::text||id::text) LIMIT 1;
        END IF;
        CONTINUE WHEN EXISTS (SELECT 1 FROM public.order_items WHERE order_id = oid AND product_id = pid);
        qty := 1 + ((d*k*j) % 4);
        IF pid = hot AND d = 2 AND k = 1 THEN qty := 47; END IF;
        SELECT p.price INTO uprice FROM public.products p WHERE p.id = pid;
        INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, line_total, created_at)
        VALUES (oid, pid, qty, uprice, round(uprice*qty,2), odate);
        sub := sub + round(uprice*qty,2);
      END LOOP;

      UPDATE public.orders SET subtotal = sub, tax = round(sub*0.16,2), total = round(sub*1.16,2) WHERE id = oid;
    END LOOP;
  END LOOP;
END $$;

DO $$
DECLARE p RECORD; sold INTEGER; target INTEGER; initial INTEGER; i INTEGER := 0;
BEGIN
  FOR p IN SELECT * FROM public.products ORDER BY sku LOOP
    i := i + 1;
    SELECT COALESCE(SUM(oi.quantity),0) INTO sold
    FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.product_id = p.id AND o.status NOT IN ('pendiente','cancelado');

    target := CASE WHEN i % 9 = 0 THEN GREATEST(p.min_stock - 3, 0)
                   WHEN i % 7 = 0 THEN GREATEST(p.min_stock - 1, 0)
                   WHEN i % 5 = 0 THEN p.max_stock - 10
                   ELSE 25 + (i * 13) % 90 END;
    initial := sold + target;

    INSERT INTO public.inventory_movements (product_id, type, quantity, stock_before, stock_after, reason, reference, created_at)
    VALUES (p.id, 'entrada', GREATEST(initial,1), 0, GREATEST(initial,1), 'Inventario inicial (datos demo)', 'SEED', now() - interval '91 days');
  END LOOP;

  INSERT INTO public.inventory_movements (product_id, type, quantity, stock_before, stock_after, reason, reference, order_id, created_at)
  SELECT oi.product_id, 'salida', oi.quantity, 0, 0, 'Salida por venta', o.code, o.id, o.created_at
  FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
  WHERE o.status NOT IN ('pendiente','cancelado');
END $$;

WITH ordered AS (
  SELECT id, product_id, created_at,
         CASE WHEN type = 'entrada' THEN quantity ELSE -quantity END AS delta,
         row_number() OVER (PARTITION BY product_id ORDER BY created_at, (type='entrada') DESC, id) AS rn
  FROM public.inventory_movements
), running AS (
  SELECT id, product_id, rn, delta,
         SUM(delta) OVER (PARTITION BY product_id ORDER BY rn) AS after_stock,
         SUM(delta) OVER (PARTITION BY product_id ORDER BY rn) - delta AS before_stock
  FROM ordered
)
UPDATE public.inventory_movements m
SET stock_before = r.before_stock, stock_after = r.after_stock
FROM running r WHERE r.id = m.id;

UPDATE public.products p
SET stock = COALESCE((
  SELECT m.stock_after FROM public.inventory_movements m
  WHERE m.product_id = p.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1), 0);

INSERT INTO public.transactions (type, amount, order_id, customer_id, description, created_at)
SELECT 'venta', o.total, o.id, o.customer_id, 'Venta confirmada ' || o.code, o.created_at
FROM public.orders o WHERE o.status NOT IN ('pendiente','cancelado');
