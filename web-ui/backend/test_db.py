from hyperdb import HypergraphDB



bd = HypergraphDB()
bd.add_v(1, {"name": "Alice"})
bd.add_v(2, {"name": "Bob"})
bd.add_v(3, {"name": "Charlie"})
bd.add_v(4, {"name": "David"})
bd.add_v(5, {"name": "Eve"})
bd.add_v(6, {"name": "Frank"})
bd.add_e((1, 2), {"relation": "knows"})
bd.add_e((1, 3), {"relation": "knows"})
bd.add_e((2, 3, 4), {"relation": "knows"})
bd.add_e((3, 4, 1, 5), {"relation": "study"})
bd.add_e((6, 5, 4), {"relation": "study"})
bd.add_e((1, 5, 6), {"relation": "study"})



bd.draw()