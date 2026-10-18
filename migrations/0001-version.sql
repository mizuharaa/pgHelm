DO $$
BEGIN
  IF current_setting('server_version_num')::integer NOT BETWEEN 170000 AND 179999 THEN
    RAISE EXCEPTION 'pgHelm Slice 1 requires PostgreSQL 17';
  END IF;
  IF pgque.version() <> '0.2.2' THEN
    RAISE EXCEPTION 'pgHelm requires pinned PgQue 0.2.2';
  END IF;
END;
$$;
